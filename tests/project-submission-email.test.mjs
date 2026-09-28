import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectSubmissionEmail, sendProjectSubmissionEmail } from '../src/server/project-submission-email.mjs';

const project = {
  id: 'project-123', lock_version: 4, slug: 'safe-project', title: 'Safe <Project>',
  category: 'Technology', external_url: 'https://example.com/', summary: 'A useful & practical tool.',
};

test('project submission email includes safe project details and the direct review link', () => {
  const message = projectSubmissionEmail({
    project,
    submitter: { firstName: 'Ava', lastName: 'Maker', email: 'ava@example.com' },
    siteUrl: 'https://trymybuild.com/path',
  });
  assert.equal(message.subject, 'New project submitted: Safe <Project>');
  assert.equal(message.reviewUrl, 'https://trymybuild.com/admin/project?slug=safe-project');
  assert.match(message.text, /Ava Maker \(ava@example\.com\)/);
  assert.match(message.html, /Safe &lt;Project&gt;/);
  assert.match(message.html, /A useful &amp; practical tool\./);
  assert.doesNotMatch(message.html, /<h2[^>]*>Safe <Project>/);
});

test('email delivery is skipped when transactional email is not configured', async () => {
  let calls = 0;
  const result = await sendProjectSubmissionEmail({ project, submitter: {} }, {
    env: () => '',
    fetch: async () => { calls++; return new Response('{}'); },
  });
  assert.deepEqual(result, { skipped: true });
  assert.equal(calls, 0);
});

test('email delivery uses the founder address and a revision-specific duplicate key', async () => {
  let request;
  const values = {
    RESEND_API_KEY: 'secret-key', FOUNDER_EMAIL: 'founder@example.com',
    PUBLIC_APP_URL: 'https://trymybuild.com', PROJECT_REVIEW_FROM: 'TryMyBuild <review@example.com>',
  };
  const result = await sendProjectSubmissionEmail({ project, submitter: { firstName: 'Ava' } }, {
    env: key => values[key] || '',
    fetch: async (url, options) => { request = { url, options }; return new Response('{"id":"email-1"}', { status: 200 }); },
  });
  assert.deepEqual(result, { sent: true, id: 'email-1' });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.headers['Idempotency-Key'], 'project-review/project-123/4');
  const body = JSON.parse(request.options.body);
  assert.deepEqual(body.to, ['founder@example.com']);
  assert.equal(body.from, 'TryMyBuild <review@example.com>');
});

test('the project route emails only a newly completed submission transition', () => {
  const source = readFileSync(new URL('../src/pages/api/projects.ts', import.meta.url), 'utf8');
  assert.match(source, /if\(!result\.error&&!result\.idempotent\)/);
  assert.match(source, /await sendProjectSubmissionEmail\(\{project:result\.project,submitter:user\}\)/);
});

