import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { parse } from '@babel/parser';

// dev/ipados/visual-inventory.mjs — inventory actual registry entries and their source parameters.
const root = resolve(import.meta.dirname, '../..');
const visualRoot = resolve(root, 'src/components/visualizer');
async function walk(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) files.push(...await walk(path));
        else if (/\.(tsx?|css|glsl|frag|vert)$/.test(entry.name)) files.push(path);
    }
    return files;
}
const declaredSource = await readFile(resolve(root, 'src/types/visualizerModes.ts'), 'utf8');
const getDeclared = name => [...declaredSource.match(new RegExp(`${name} = \\[([\\s\\S]*?)\\] as const`))[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const groups = [['lyrics', visualRoot, getDeclared('BUILTIN_VISUALIZER_MODES')], ['backgrounds', resolve(visualRoot, 'backgrounds'), getDeclared('BUILTIN_VISUALIZER_BACKGROUND_MODES')]];
const inventory = { baseline: '33b25ff75252435a78006af45114fdf10e64727a', modes: [] };
for (const [kind, directory, declared] of groups) {
    const actual = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        let source;
        try { source = await readFile(resolve(directory, entry.name, 'entry.tsx'), 'utf8'); } catch { continue; }
        const id = source.match(/mode:\s*'([^']+)'/)?.[1];
        if (!id) throw new Error(`Missing mode in ${entry.name}`);
        actual.push(id);
        const files = [];
        for (const path of (await walk(resolve(directory, entry.name))).sort()) {
            const text = await readFile(path, 'utf8');
            files.push({ path: relative(root, path), sha256: createHash('sha256').update(text).digest('hex'), imports: [...text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(match => match[1]), parameters: [...new Set([...text.matchAll(/(?:tuning|config)\??\.([A-Za-z_][\w]*)/g)].map(match => match[1]))].sort() });
        }
        inventory.modes.push({ kind, id, entry: relative(root, resolve(directory, entry.name, 'entry.tsx')), files });
    }
    if (actual.sort().join() !== [...declared].sort().join()) throw new Error(`${kind} registry mismatch: ${actual}`);
}
// Preserve the complete shared parameter declarations/defaults as well as local property observations.
const sharedText = await readFile(resolve(root, 'src/types.ts'), 'utf8');
const sharedAst = parse(sharedText, { sourceType: 'module', plugins: ['typescript'] });
inventory.parameterDefinitions = sharedAst.program.body.map(node => node.type === 'ExportNamedDeclaration' ? node.declaration : node).filter(node => node && (
    node.type === 'TSInterfaceDeclaration' && /Tuning$/.test(node.id.name)
    || node.type === 'TSTypeAliasDeclaration' && /(?:Quality|BackgroundDisplayMode|BackgroundEffect)$/.test(node.id.name)
    || node.type === 'VariableDeclaration' && node.declarations.some(item => item.id.type === 'Identifier' && /DEFAULT_.*TUNING/.test(item.id.name))
)).map(node => ({ source: 'src/types.ts', declaration: sharedText.slice(node.start, node.end) }));
const shotSource = await readFile(resolve(visualRoot, 'tempera/types.ts'), 'utf8');
const shotAst = parse(shotSource, { sourceType: 'module', plugins: ['typescript'] });
const shotDeclaration = shotAst.program.body.flatMap(node => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration' ? node.declaration.declarations : []).find(node => node.id.name === 'TEMPERA_SHOT_KINDS');
const shotArray = shotDeclaration.init.type === 'TSAsExpression' ? shotDeclaration.init.expression : shotDeclaration.init;
inventory.temperaShots = shotArray.elements.map(node => {
    if (node.type !== 'StringLiteral') throw new Error('Non-literal Tempera shot ID');
    return node.value;
});
inventory.sharedSources = [];
for (const path of ['src/types.ts', 'src/types/visualizerModes.ts', 'src/components/visualizer/registry.tsx',
    'src/components/visualizer/tuningRegistry.ts', 'src/components/visualizer/backgrounds/registry.tsx',
    'src/components/visualizer/backgrounds/common/FluidBackground.tsx', 'src/services/customLyricsFont.ts', 'src/utils/fontStacks.ts', 'src/library/registry.ts']) {
    try { const value = await readFile(resolve(root, path), 'utf8'); inventory.sharedSources.push({ path, sha256: createHash('sha256').update(value).digest('hex') }); }
    catch { throw new Error(`Inventory source missing: ${path}`); }
}
inventory.librarySuites = [];
for (const id of ['grid', 'bravais', 'tui']) {
    const path = `src/library/suites/${id}/entry.ts`;
    const source = await readFile(resolve(root, path), 'utf8');
    inventory.librarySuites.push({ id, path, productionAvailable: id !== 'tui', sha256: createHash('sha256').update(source).digest('hex') });
}
await writeFile(resolve(root, 'docs/ipados-visual-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
console.log(`Inventoried ${inventory.modes.filter(mode => mode.kind === 'lyrics').length} lyric renderers and ${inventory.modes.filter(mode => mode.kind === 'backgrounds').length} backgrounds; no modes excluded.`);
