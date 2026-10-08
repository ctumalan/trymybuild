import { database } from './database';

export type PublicReview = {
  author: string;
  avatar: string;
  attempt: string;
  focus: string;
  message: string;
  createdAt: string;
};

export type ReviewEvidence = {
  total: number;
  publicCount: number;
  reviews: PublicReview[];
};

// A qualifying review is a firsthand response from an active community member.
// Visibility controls the content, never whether the creator received the review.
export async function reviewEvidence(projectSlug: string): Promise<ReviewEvidence> {
  const db = database();
  const project = await db.from('projects').select('slug').eq('slug', projectSlug).eq('listing_status', 'published').maybeSingle();
  if (project.error) throw project.error;
  if (!project.data) return { total: 0, publicCount: 0, reviews: [] };

  const feedback = await db.from('creator_feedback')
    .select('author_user_id,attempt,focus,message,visibility,moderation_status,created_at')
    .eq('project_slug', projectSlug)
    .neq('moderation_status', 'hidden')
    .neq('attempt', 'not_tried')
    .order('created_at', { ascending: false })
    .limit(500);
  if (feedback.error) throw feedback.error;

  const authorIds = [...new Set((feedback.data || []).map(row => row.author_user_id).filter(Boolean))];
  if (!authorIds.length) return { total: 0, publicCount: 0, reviews: [] };
  const members = await db.from('users').select('id,system_role,account_status').in('id', authorIds);
  if (members.error) throw members.error;
  const eligibleIds = new Set((members.data || [])
    .filter(member => member.account_status === 'active' && member.system_role !== 'admin')
    .map(member => member.id));
  const eligible = (feedback.data || []).filter(row => eligibleIds.has(row.author_user_id));
  const published = eligible.filter(row => row.visibility === 'public' && row.moderation_status === 'published');
  const publicAuthorIds = [...new Set(published.map(row => row.author_user_id))];
  const profiles = publicAuthorIds.length
    ? await db.from('profiles').select('user_id,display_name,avatar_path').in('user_id', publicAuthorIds)
    : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const byAuthor = new Map((profiles.data || []).map(profile => [profile.user_id, profile]));

  return {
    total: eligible.length,
    publicCount: published.length,
    reviews: published.map(row => {
      const profile: any = byAuthor.get(row.author_user_id);
      return {
        author: profile?.display_name || 'TryMyBuild member',
        avatar: profile?.avatar_path || '',
        attempt: row.attempt || '',
        focus: row.focus || '',
        message: row.message || '',
        createdAt: row.created_at,
      };
    }),
  };
}
