// Founder-authored notes for individual invitations. Kept in the server bundle,
// never in the public catalog or client assets. The invitation route checks its
// signed link and lifecycle before rendering these notes.
const reviews = {
  '87829b6d-f5bb-4a3d-afd1-c823a3d812f0': {
    author: 'Christian Tumalan',
    date: 'October 15, 2026',
    scope: 'Public website review. I explored firandfieldtools.com and its published terms; I haven’t tested the signed-in job tools.',
    headline: 'The example schedule makes the product easy to understand, and the $9.99/month price and no-card trial are clear.',
    notes: [
      {title: 'What works well', text: 'The two-week lookahead paired with daily site notes gives Fir & Field a clear focus for small contractors. The example schedule helps explain the idea immediately. Showing the price, no-card trial, and download access after cancellation together makes the decision easier to understand.'},
      {title: 'One improvement I would try first', text: 'Add a “Try a sample job” option or a short walkthrough showing one task moving from the day list to the timeline, then into a daily note. Right now, I can understand the promise, but I need an account to explore the actual workflow. A sample would let a new visitor judge whether it fits their day before signing up.'},
      {title: 'A small trust detail', text: 'The homepage Contact link uses 604decordesign@gmail.com, while the Terms page lists mazeria8888@gmail.com. If both are correct, explain which one handles support; otherwise, use the same contact address throughout.'},
      {title: 'A useful first test', text: 'Ask a contractor to plan one real job’s next two weeks, add a daily note, and prepare the next handoff to a GC or owner. Watch where they hesitate. That would test the practical workflow rather than just whether the landing page sounds appealing.'},
    ],
  },
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const invitationFeedback = id => reviews[id] || null;
export function feedbackPanel(review) {
  if (!review) return '';
  return `<section class="invitation-founder-feedback" id="founder-feedback" aria-labelledby="founder-feedback-title"><p class="eyebrow">A personal first look</p><h2 id="founder-feedback-title">My feedback on your app</h2><p class="invitation-feedback-byline">${escape(review.author)} · ${escape(review.date)}</p><p class="invitation-feedback-scope">${escape(review.scope)}</p><p class="invitation-feedback-lead">${escape(review.headline)}</p>${review.notes.map(note => `<section><h3>${escape(note.title)}</h3><p>${escape(note.text)}</p></section>`).join('')}<p class="invitation-feedback-footer">This feedback is here for you to read before deciding whether to join. No signup is needed to read it.</p></section>`;
}
export const renderInvitationFeedback = id => feedbackPanel(invitationFeedback(id));
