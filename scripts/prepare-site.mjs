import { copyFile, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.cw-public');
await mkdir(output, { recursive: true });
// Build-time snapshot of the existing catalog, not a second hand-maintained catalog.
const source = await readFile(path.join(root, 'app.js'), 'utf8');
const catalogSource = source.match(/^const projects = (\[[\s\S]*?\n\]);/);
if (!catalogSource) throw new Error('Catalog source not found');
const catalog = vm.runInNewContext(catalogSource[1], {}, { timeout: 1000 });
await writeFile(path.join(root, 'src/server/catalog.generated.json'), JSON.stringify(catalog.map(({slug,name,url,summary,category}) => ({slug,name,url,summary,category})), null, 2));
// Only site assets are published; documents, prompts and configuration stay private.
for (const file of ['return-preferences.js', 'interaction-polish.js', 'public-comments.js', 'ui-refinements.css', 'pricing.js', 'workspace-ui.js', 'server-mode.js', 'profile-editor.js', 'community-entry.js', 'community-input.js', 'notification-bell.js', 'project-actions.js', 'listing-rules.js', 'share-invitation.js', 'app.js', 'styles.css', 'feedback.css', 'preview-utils.js', 'project-media.js', 'account-nav.js', 'analytics.js']) await copyFile(path.join(root, file), path.join(output, file));
for (const dir of ['assets', 'projects']) {
  await cp(path.join(root, dir), path.join(output, dir), { recursive: true, filter: source => !path.basename(source).startsWith('.') });
}
console.log('Prepared website assets.');
await copyFile(path.join(root, 'launch-refinements.css'), path.join(output, 'launch-refinements.css'));
await copyFile(path.join(root, 'future-design.css'), path.join(output, 'future-design.css'));
