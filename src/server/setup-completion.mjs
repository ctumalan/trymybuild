const present = value => typeof value === 'string' && value.trim().length > 0;

const summarize = items => {
  const complete = items.filter(item => item.complete).length;
  return {items, complete, total: items.length, percent: Math.round((complete / items.length) * 100)};
};

export function profileCompletion(profile = {}) {
  return summarize([
    {key:'name', label:'Confirm your public name', complete:present(profile.display_name)},
    {key:'photo', label:'Add a photo or avatar', complete:present(profile.avatar_path)},
    {key:'identity', label:'Say what kind of creator you are', complete:present(profile.identity_label)},
    {key:'bio', label:'Write a short introduction', complete:present(profile.bio)},
  ]);
}

export function projectCompletion(project = {}) {
  return summarize([
    {key:'title', label:'Confirm the app name', complete:present(project.title)},
    {key:'url', label:'Confirm the app link', complete:present(project.external_url)},
    {key:'preview', label:'Add or confirm the preview image', complete:present(project.preview_path)},
    {key:'purpose', label:'Explain what the app is for', complete:present(project.headline)},
    {key:'benefit', label:'Explain how it helps', complete:present(project.help_text)},
    {key:'firstTry', label:'Give visitors one thing to try first', complete:present(project.first_try)},
  ]);
}

export function nextSetupStep(profile, project) {
  const app = projectCompletion(project);
  const person = profileCompletion(profile);
  const next = app.items.find(item => !item.complete) || person.items.find(item => !item.complete);
  return next?.label || 'Your app and creator profile are ready.';
}
