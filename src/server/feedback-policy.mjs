export const helpfulChoices = { yes: 'Yes, it helped', somewhat: 'Somewhat', not_yet: 'Not useful for me', unclear: 'I couldn’t tell', not_tried: 'I haven’t tried it yet' };
export const priceChoices = { worth_it: 'Worth the price', too_expensive: 'Too expensive for me', unsure: 'Not sure', free: 'It was free' };
export const attemptChoices = { completed: 'I tried the main feature', stuck: 'I tried, but got stuck', blocked: 'I couldn’t get started', not_tried: 'I haven’t tried it yet' };
export const focusChoices = { ease: 'Ease of use', bugs: 'Something went wrong', results: 'The results', explanation: 'Understanding the app', development: 'What to develop next' };
export function structuredFeedbackInput(data) {
  if (!Object.hasOwn(attemptChoices,data.attempt) || !Object.hasOwn(focusChoices,data.focus)) return null;
  const input=feedbackInput({...data,helpful:data.attempt==='not_tried'?'not_tried':data.helpful});
  return input ? {...input,attempt:data.attempt,focus:data.focus} : null;
}
export const validSlug = value => typeof value === 'string' && /^[a-z0-9-]{1,80}$/.test(value);
export const validId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const wordCount = value => typeof value === 'string' ? (value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length : 0;
export const thoughtfulComment = value => typeof value === 'string' && value.trim().length > 0;
export function feedbackInput(data) {
  if (!validSlug(data.slug) || !Object.hasOwn(helpfulChoices, data.helpful) || !Object.hasOwn(priceChoices, data.price)
    || !['public','private'].includes(data.visibility) || !thoughtfulComment(data.message)) return null;
  return { project_slug: data.slug, helpful: data.helpful, price: data.price, visibility: data.visibility, message: data.message.trim() };
}
export function threadAccess(memberId, authorId, ownerId) { return !!memberId && (memberId === authorId || memberId === ownerId); }
export function feedbackDestination(value) {
  if(typeof value==='string'&&/^\/people\/[a-z0-9-]{1,80}$/.test(value))return value;
  if(value==='/dashboard/messages' || typeof value==='string' && /^\/dashboard\/messages\?thread=[0-9a-f-]{36}$/.test(value))return value;
  // Only a local category return path is accepted; never an arbitrary redirect.
  if (typeof value === 'string' && value.startsWith('/?category=')) {
    const url = new URL(value, 'https://local.invalid');
    const category = url.searchParams.get('category');
    if (url.pathname === '/' && category && category.length <= 80 && !/[\u0000-\u001f]/.test(category)
      && [...url.searchParams.keys()].every(key => key === 'category')) {
      return '/?category=' + encodeURIComponent(category) + '#category-community';
    }
  }
  if (['/','/dashboard/community','/dashboard/exchange','/dashboard/security','/dashboard/overview','/dashboard/preferences','/dashboard/notifications','/dashboard/privacy','/dashboard/help'].includes(value)) return value;
  if (value === '/?welcome=1' || value === '/?wish=1#wish-list') return value;
  if (value === 'listing' || value === '/?listing=settings') return '/?listing=settings';
  if (value === 'listing-dashboard' || value === '/?listing=settings&after=dashboard') return '/?listing=settings&after=dashboard';
  if (value === '/dashboard' || value === '/dashboard?view=creator' || value === '/dashboard/profile') return value;
  if(typeof value==='string' && /^\/projects\/[a-z0-9-]{1,80}$/.test(value))return value;
  if (typeof value === 'string' && /^\/tell\/[a-z0-9-]{1,80}$/.test(value)) return value;
  if (typeof value === 'string' && /^\/\?project=[a-z0-9-]{1,80}$/.test(value)) return value;
  return '/?account=1';
}
