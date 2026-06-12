import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const failures = [];
const ignoredDirectories = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);
const nodePackageDirs = ['apps/api', 'packages/shared'];
const webPackageDirs = ['apps/web'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function fail(message) {
  failures.push(message);
}

function normalize(path) {
  return path.split(sep).join('/');
}

function isInDirectory(file, dir) {
  const rel = normalize(relative(root, file));
  return rel === dir || rel.startsWith(`${dir}/`);
}

function isInAnyDirectory(file, dirs) {
  return dirs.some((dir) => isInDirectory(file, dir));
}

function packageJsonFiles() {
  return [
    join(root, 'package.json'),
    ...nodePackageDirs.map((dir) => join(root, dir, 'package.json')),
    ...webPackageDirs.map((dir) => join(root, dir, 'package.json')),
  ].filter(existsSync);
}

function tsconfigFiles() {
  return walk(root).filter((file) => /tsconfig(?:\.[^.]+)?\.json$/.test(file));
}

function sourceFiles() {
  return walk(root).filter(
    (file) =>
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.mts')) &&
      !file.endsWith('.d.ts'),
  );
}

for (const file of packageJsonFiles()) {
  const pkg = readJson(file);

  if (pkg.type !== 'module') {
    fail(`${relative(root, file)} is missing "type": "module"`);
  }
}

for (const file of tsconfigFiles()) {
  const rel = normalize(relative(root, file));
  const tsconfig = readJson(file);
  const options = tsconfig.compilerOptions ?? {};

  if (rel === 'tsconfig.base.json' || isInAnyDirectory(file, nodePackageDirs)) {
    if (options.module && options.module !== 'NodeNext') {
      fail(`${rel} should use compilerOptions.module = "NodeNext"`);
    }

    if (options.moduleResolution && options.moduleResolution !== 'NodeNext') {
      fail(`${rel} should use compilerOptions.moduleResolution = "NodeNext"`);
    }
  }

  if (isInAnyDirectory(file, webPackageDirs)) {
    if (options.moduleResolution && options.moduleResolution !== 'Bundler') {
      fail(`${rel} should use compilerOptions.moduleResolution = "Bundler" for Vite`);
    }
  }
}

for (const file of sourceFiles()) {
  const content = readFileSync(file, 'utf8');
  const rel = normalize(relative(root, file));

  if (/\brequire\s*\(/.test(content)) {
    fail(`${rel} uses require()`);
  }

  if (/\bmodule\.exports\b/.test(content)) {
    fail(`${rel} uses module.exports`);
  }

  if (/\bexports\./.test(content)) {
    fail(`${rel} uses exports.*`);
  }

  if (isInAnyDirectory(file, nodePackageDirs)) {
    const badImportRegex =
      /\bfrom\s+["'](\.{1,2}\/(?![^"']*(?:\.js|\.json|\.node|\.css)["'])[^"']+)["']/g;

    for (const match of content.matchAll(badImportRegex)) {
      fail(`${rel} has relative import without runtime extension: ${match[1]}`);
    }
  }
}

if (failures.length > 0) {
  console.error('ESM check failed:\n');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log('ESM check passed.');
