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

type EligibleFeedback = {
  author_user_id: string;
  project_slug: string;
  attempt: string;
  focus: string;
  message: string;
  visibility: string;
  moderation_status: string;
  created_at: string;
};

async function eligibleFeedback(projectSlugs: string[]): Promise<EligibleFeedback[]> {
  if (!projectSlugs.length) return [];
  const db = database();
  const feedback = await db.from('creator_feedback')
    .select('author_user_id,project_slug,attempt,focus,message,visibility,moderation_status,created_at')
    .in('project_slug', projectSlugs)
    .neq('moderation_status', 'hidden')
    .neq('attempt', 'not_tried')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (feedback.error) throw feedback.error;
  const authorIds = [...new Set((feedback.data || []).map(row => row.author_user_id).filter(Boolean))];
  if (!authorIds.length) return [];
  const members = await db.from('users').select('id,system_role,account_status').in('id', authorIds);
  if (members.error) throw members.error;
  const eligibleIds = new Set((members.data || [])
    .filter(member => member.account_status === 'active' && member.system_role !== 'admin')
    .map(member => member.id));
  return (feedback.data || []).filter(row => eligibleIds.has(row.author_user_id));
}

export async function reviewEvidenceCounts(projectSlugs: string[]) {
  const unique = [...new Set(projectSlugs.filter(Boolean))];
  const counts = new Map(unique.map(slug => [slug, { total: 0, publicCount: 0 }]));
  for (const row of await eligibleFeedback(unique)) {
    const count = counts.get(row.project_slug);
    if (!count) continue;
    count.total += 1;
    if (row.visibility === 'public' && row.moderation_status === 'published') count.publicCount += 1;
  }
  return counts;
}

// A qualifying review is a firsthand response from an active community member.
// Visibility controls the content, never whether the creator received the review.
export async function reviewEvidence(projectSlug: string): Promise<ReviewEvidence> {
  const db = database();
  const project = await db.from('projects').select('slug').eq('slug', projectSlug).eq('listing_status', 'published').maybeSingle();
  if (project.error) throw project.error;
  if (!project.data) return { total: 0, publicCount: 0, reviews: [] };

  const eligible = await eligibleFeedback([projectSlug]);
  if (!eligible.length) return { total: 0, publicCount: 0, reviews: [] };
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
