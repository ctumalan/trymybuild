export const articles = [
  {
    href: '/article/how-to-find-willing-beta-testers-for-your-new-app',
    title: 'How to find willing beta testers for your new app',
    description: 'Where to look, what to say, and how to turn a willing tester into useful feedback. Includes two invitations you can adapt.',
    date: '2026-10-16',
    type: 'Practical guide',
    readTime: '8 min read',
    image: '/assets/articles/find-willing-beta-testers.webp',
    alt: 'Creators gathering around an app, with the words Find Beta Testers and Build Better Together.',
  },
  {
    href: '/article/find-beta-users-with-no-audience',
    title: 'You built the app. Now find your people.',
    description: 'Six practical steps to find beta users with no audience, one useful conversation at a time.',
    date: '2026-10-03',
    type: 'The maker’s field guide',
    readTime: '6 min read',
    image: '/assets/articles/find-beta-users.webp',
    alt: 'An illustrated path from a new build to relevant people and useful feedback.',
  },
  {
    href: '/guides/first-app-testers',
    title: 'Your first app testers, one small step at a time',
    description: 'A quick checklist for choosing a person, setting a task, and asking what happened.',
    date: '2026-10-03',
    type: 'Quick start',
    readTime: '3 min read',
    image: '/assets/articles/beta-feedback-session.webp',
    alt: 'A maker listening while a tester tries an app on a phone.',
  },
].sort((a, b) => b.date.localeCompare(a.date));

export const formatArticleDate = (date: string) => new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`));

export const articleMonth = (date: string) => new Intl.DateTimeFormat('en-US', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`));
