export const quickFeedbackOptions = {
  too_much_to_read: 'Too much to read',
  hard_to_understand: 'Hard to understand',
  unexpected: 'Not what I expected',
  curious: 'Just curious',
};
export function quickFeedbackInput(body) {
  if (!body || typeof body.slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(body.slug)) return null;
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) return null;
  if (!Array.isArray(body.reasons) || !body.reasons.length || body.reasons.length > 4 || body.reasons.some(r => !Object.hasOwn(quickFeedbackOptions,r))) return null;
  return {project_slug:body.slug,id:body.requestId,reasons:[...new Set(body.reasons)]};
}
