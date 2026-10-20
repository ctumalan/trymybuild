// Founder-authored notes for individual invitations. Kept in the server bundle,
// never in the public catalog or client assets. The invitation route checks its
// signed link and lifecycle before rendering these notes.
const reviews = {
  'cd700b60-059c-4547-9fb4-d98467232b2f': {
    author: 'Christian Tumalan',
    date: 'October 20, 2026',
    scope: 'Primera revisión de las páginas públicas. Revisé el inicio, Unir PDF, PDF a Word, PDF a DOCX y las páginas de información y contacto. No he procesado archivos ni comprobado la calidad de las conversiones o el comportamiento de privacidad.',
    headline: 'Aclara la diferencia entre PDF a Word y PDF a DOCX antes de que el usuario tenga que elegir.',
    notes: [
      {title: 'Una mejora que probaría primero', text: 'En el inicio aparecen PDF a Word y PDF a DOCX como herramientas distintas, pero la pregunta frecuente de DOCX explica que ambas hacen la misma conversión y generan un archivo .docx. Unificaría las tarjetas o indicaría esa equivalencia directamente en ellas. Así alguien que solo quiere editar su PDF no tiene que abrir las dos páginas para decidir.'},
      {title: 'Lo que funciona bien', text: 'El inicio explica de inmediato que el servicio es gratuito, está en español y no requiere registro. Las categorías ayudan a recorrer las herramientas. La página Unir PDF presenta un botón claro para elegir archivos y explica cómo ordenarlos antes de descargar el resultado. La afirmación de que los documentos se procesan en el dispositivo está visible desde el inicio; la he leído, pero no la he verificado técnicamente.'},
      {title: 'Una prueba útil con un usuario nuevo', text: 'Pide a alguien que llegue al inicio y encuentre cómo convertir un PDF en un documento editable de Word. Observa si duda entre las dos tarjetas y si necesita consultar la ayuda. Después, con un archivo de prueba sin datos personales, comprueba si puede completar la tarea y abrir el resultado sin instrucciones adicionales.'},
    ],
  },
  'c11bc6b4-a1de-4d1d-a1fc-0e27c13fb7ac': {
    author: 'Christian Tumalan',
    date: 'October 18, 2026',
    scope: 'Public website quick look and our earlier Reddit exchange. I reviewed the updated homepage and the earlier trip-length issue we discussed. I haven’t tested the revised results flow or checkout.',
    headline: 'Make it unmistakable which plans cover the traveler’s full trip.',
    notes: [
      {title: 'What works well', text: 'The updated homepage makes the starting point clearer. Destination comes first, while trip length and data preference are presented as optional details. That keeps the first decision simple without hiding useful filters.'},
      {title: 'One improvement I would try first', text: 'When someone selects a 14-day trip, show plans that cover at least 14 days by default. If shorter plans still belong in the results, separate them under a clear “May not cover your full trip” label so they cannot be mistaken for complete-trip options.'},
      {title: 'A useful first test', text: 'Ask a first-time traveler to select a 14-day trip and choose a plan without help. Then ask which options cover the whole trip and why a 15-day plan may be recommended. Note whether the recommendation section and comparison results feel consistent.'},
    ],
  },
  '28e23e48-912d-49e5-b80a-7d1e4e9926c2': {
    author: 'Christian Tumalan',
    date: 'October 16, 2026',
    scope: 'Public website quick look. I reviewed the opening sign-in and create-account screens, plus the public help and recommendations pages. I haven’t created an account, tested the feed or verified the recommendation system.',
    headline: 'Show the discovery promise before asking a new creator to sign up.',
    notes: [
      {title: 'What I noticed', text: 'The public Content and recommendations page explains that discovery includes opportunities for new creators and posts with limited exposure. It also makes clear that follower count does not guarantee recommendation. That gives a visitor more useful context than the broad promise of a fair chance alone.'},
      {title: 'One improvement I would try first', text: 'Put a short version of the Discovery and diversity explanation next to Create account, with a link to a sample public post or clearly labeled demo feed. Right now a visitor sees Sign in first, while that useful reason to join is a few clicks away in Help and trust.'},
      {title: 'A useful first test', text: 'Ask a creator who hasn’t seen SARELY before to open the homepage and explain who it is for and what they expect discovery to do differently. Then ask whether the sample gives them enough context to decide about signing up. This would test the clarity of the introduction, not the fairness or performance of the recommendation system.'},
    ],
  },
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
  '426ff309-33bd-4188-9f05-9a8be9ef59f5': {
    author: 'Christian Tumalan',
    date: 'October 16, 2026',
    scope: 'A quick look based on your changelog and our earlier visual feedback. I haven’t run through the updated lesson or tested a signed-in account.',
    headline: 'Check the first tutorial step with a new learner.',
    notes: [
      {title: 'What I noticed', text: 'Your changelog describes shorter tutorial cards and a folding checklist. Those are the areas we discussed in the earlier feedback. I haven’t run through the update, so I can’t say how the new flow feels in use.'},
      {title: 'One improvement I would try first', text: 'Ask a new learner to follow just the first tutorial step without hints, then tell you where they hesitated. That gives you a focused way to check whether the new guidance is helping.'},
      {title: 'A useful first test', text: 'Watch whether the learner can find the instruction, see the relevant controls, and explain what to do next. Note where you need to help. This would test the clarity of the lesson, not validate electrical safety or technical accuracy.'},
    ],
  },
  'efbe74b2-e9de-4de7-9aa6-4f8703678d02': {
    author: 'Christian Tumalan',
    date: 'October 16, 2026',
    scope: 'A quick look at the public pages only. I haven’t played through a session or tested a signed-in account.',
    headline: 'Show what makes a word roll interesting before the first roll.',
    notes: [
      {title: 'What I noticed', text: 'The About page explains how badges add up to EP and affect rarity. A new visitor could benefit from seeing a concrete example alongside the roll button, before opening the longer explanation.'},
      {title: 'One improvement I would try first', text: 'Show a sample word with its badges and EP breakdown beside the roll button. That would help a new player understand what makes a roll interesting before opening the longer explanation.'},
      {title: 'A useful first test', text: 'Ask a first-time visitor to look at the sample and explain what its badges and EP mean. Note which parts are clear and which need an explanation before asking them to try a roll.'},
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
 const date=new Date(review.date),dateAttribute=Number.isNaN(date.getTime())?'':` datetime="${date.toISOString().slice(0,10)}"`;
 const dateLabel=Number.isNaN(date.getTime())?review.date:date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 const picture=review.author==='Christian Tumalan'?'<img src="/assets/avatars/chris-nava-founder.jpg" alt="">':escape(review.author.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join(''));
 const noteMarkup=note=>`<section><h3>${escape(note.title)}</h3><p>${escape(note.text)}</p></section>`;
 const reviewer=review.author==='Christian Tumalan'?`<a class="invitation-reviewer-profile" href="/people/christian-tumalan"><span class="person-avatar byline-avatar" aria-hidden="true">${picture}</span><span><strong id="invitation-review">${escape(review.author)}</strong><small>Founder of TryMyBuild</small></span></a>`:`<span class="invitation-reviewer-profile"><span class="person-avatar byline-avatar" aria-hidden="true">${picture}</span><span><strong id="invitation-review">${escape(review.author)}</strong><small>App reviewer</small></span></span>`;
 return `<section class="invitation-founder-feedback invitation-native-feedback" id="founder-feedback" aria-labelledby="invitation-review-heading"><h3 id="invitation-review-heading">Christian’s review of your app</h3><article class="public-review-card"><header>${reviewer}<time${dateAttribute}>${escape(dateLabel)}</time></header><p class="invitation-feedback-scope">${escape(review.scope)}</p><p class="invitation-feedback-lead">${escape(review.headline)}</p>${primary?`<p class="invitation-feedback-primary">${escape(primary.text)}</p>`:''}<details class="invitation-feedback-more"><summary>Read the full review</summary>${remaining.map(noteMarkup).join('')}</details></article></section>`;
}
export const renderInvitationFeedback = id => feedbackPanel(invitationFeedback(id));
