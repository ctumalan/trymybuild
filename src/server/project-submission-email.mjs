const clean = value => String(value || '').trim();
const html = value => clean(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const appOrigin = value => {
  try { return new URL(value || 'https://trymybuild.com').origin; }
  catch { return 'https://trymybuild.com'; }
};

export function projectSubmissionEmail({ project, submitter, siteUrl }) {
  const title = clean(project?.title) || 'Untitled project';
  const slug = clean(project?.slug);
  const reviewUrl = new URL('/admin/project', appOrigin(siteUrl));
  if (slug) reviewUrl.searchParams.set('slug', slug);
  const name = [submitter?.firstName, submitter?.lastName].map(clean).filter(Boolean).join(' ') || 'A creator';
  const address = clean(submitter?.email);
  const byline = address ? `${name} (${address})` : name;
  const details = [
    ['Submitted by', byline],
    ['Category', clean(project?.category) || 'Not supplied'],
    ['Website', clean(project?.external_url) || 'Not supplied'],
    ['Summary', clean(project?.summary) || 'Not supplied'],
  ];
  const text = [
    `A project is ready for review: ${title}`,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    `Review project: ${reviewUrl.href}`,
  ].join('\n');
  const rows = details.map(([label, value]) => `<tr><th align="left" style="padding:6px 14px 6px 0;vertical-align:top">${html(label)}</th><td style="padding:6px 0">${html(value)}</td></tr>`).join('');
  return {
    subject: `New project submitted: ${title}`,
    text,
    html: `<h1 style="font-size:22px">A project is ready for review</h1><h2 style="font-size:18px">${html(title)}</h2><table role="presentation" style="border-collapse:collapse">${rows}</table><p style="margin-top:22px"><a href="${html(reviewUrl.href)}">Review project in TryMyBuild</a></p>`,
    reviewUrl: reviewUrl.href,
  };
}

export async function sendProjectSubmissionEmail({ project, submitter }, deps = {}) {
  const getEnv = deps.env || (key => process.env[key] || '');
  const apiKey = clean(getEnv('RESEND_API_KEY'));
  const to = clean(getEnv('PROJECT_REVIEW_EMAIL')) || clean(getEnv('FOUNDER_EMAIL'));
  if (!apiKey || !to) return { skipped: true };

  const message = projectSubmissionEmail({ project, submitter, siteUrl: getEnv('PUBLIC_APP_URL') });
  const from = clean(getEnv('PROJECT_REVIEW_FROM')) || 'TryMyBuild <notifications@trymybuild.com>';
  const response = await (deps.fetch || fetch)('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `project-review/${project.id}/${project.lock_version}`.slice(0, 256),
    },
    body: JSON.stringify({ from, to: [to], subject: message.subject, text: message.text, html: message.html }),
  });
  if (!response.ok) throw new Error(`Project review email failed (${response.status})`);
  const result = await response.json().catch(() => ({}));
  return { sent: true, id: result.id || '' };
}

