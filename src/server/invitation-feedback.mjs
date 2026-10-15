// Founder-authored notes for individual invitations. Kept in the server bundle,
// never in the public catalog or client assets. The invitation route checks its
// signed link and lifecycle before rendering these notes.
const reviews = {
  '87829b6d-f5bb-4a3d-afd1-c823a3d812f0': {
    author: 'Christian Tumalan',
    date: 'October 15, 2026',
    scope: 'Public website review. I explored firandfieldtools.com and its published terms; I haven’t tested the signed-in job tools.',
    headline: 'Let contractors try a sample job before they create an account.',
    notes: [
      {title: 'What works well', text: 'The two-week lookahead paired with daily site notes gives Fir & Field a clear focus for small contractors. The example schedule helps explain the idea immediately. Showing the price, no-card trial, and download access after cancellation together makes the decision easier to understand.'},
      {title: 'One improvement I would try first', text: 'Add a “Try a sample job” option or a short walkthrough showing one task moving from the day list to the timeline, then into a daily note. Right now, I can understand the promise, but I need an account to explore the actual workflow. A sample would let a new visitor judge whether it fits their day before signing up.'},
      {title: 'A small trust detail', text: 'Your Contact page and Terms page list two different email addresses. Make them consistent, or explain which one handles support.'},
      {title: 'A useful first test', text: 'Ask a contractor to plan one real job’s next two weeks, add a daily note, and prepare the next handoff to a GC or owner. Watch where they hesitate. That would test the practical workflow rather than just whether the landing page sounds appealing.'},
    ],
  },
};
// Reviews are authored from public product observations, never recipient contact records.
// Keep contact details out of both the full-page review and the saved-app view.
export function reviewText(value) {
 return String(value??'')
  .replace(/(?:mailto:)?[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+/gi,'[email address omitted]')
  .replace(/\+?\d[\d ().-]{7,}\d/g,match=>{
   const digits=match.replace(/\D/g,'');
   return digits.length>=9&&digits.length<=15?'[phone number omitted]':match;
  });
}
const safeReview=review=>review?{
 author:reviewText(review.author),date:reviewText(review.date),scope:reviewText(review.scope),headline:reviewText(review.headline),
 notes:(review.notes||[]).map(note=>({title:reviewText(note.title),text:reviewText(note.text)}))
}:null;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const invitationFeedback = id => safeReview(reviews[id]);
export function feedbackPanel(input) {
 const review=safeReview(input);
 if (!review) return '';
 const primary=review.notes.find(note=>note.title==='One improvement I would try first')||review.notes[0];
 const remaining=review.notes.filter(note=>note!==primary);
 const noteMarkup=note=>`<section><h3>${escape(note.title)}</h3><p>${escape(note.text)}</p></section>`;
 return `<section class="invitation-founder-feedback" id="founder-feedback" aria-labelledby="invitation-review-title"><header id="invitation-review"><p class="eyebrow">A personal first look · No signup needed</p><h2 id="invitation-review-title">Christian’s review of your app</h2><p class="invitation-feedback-byline">${escape(review.author)} · ${escape(review.date)}</p></header><p class="invitation-feedback-lead">${escape(review.headline)}</p>${primary?`<p class="invitation-feedback-primary">${escape(primary.text)}</p>`:''}<details class="invitation-feedback-more"><summary>Read the rest of my review</summary>${remaining.map(noteMarkup).join('')}<p class="invitation-feedback-scope">${escape(review.scope)}</p></details><p class="invitation-feedback-footer">A first look at your public website; I haven’t tested the signed-in tools.</p></section>`;
}
export const renderInvitationFeedback = id => feedbackPanel(invitationFeedback(id));
