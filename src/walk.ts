import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.turbo']);

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte']);

function pathIgnored(rel: string, patterns: string[]): boolean {
  const norm = rel.replace(/\\/g, '/');
  return patterns.some((pat) => {
    if (pat.includes('*')) {
      const re = new RegExp(
        '^' + pat.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '.') + '$',
      );
      return re.test(norm);
    }
    return norm.includes(pat.replace(/\\/g, '/'));
  });
}

/**
 * Recursively list source files under `root`, honouring ignore globs (simple `*` / `**`).
 */
export async function listSourceFiles(root: string, ignore: string[] = []): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(root, full);
      if (pathIgnored(rel, ignore)) continue;
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        await walk(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name);
        if (SOURCE_EXT.has(ext)) out.push(full);
      }
    }
  }

  const st = await stat(root);
  if (!st.isDirectory()) return out;
  await walk(root);
  return out;
}

export async function readSources(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    paths.map(async (p) => {
      const text = await readFile(p, 'utf8');
      map.set(p, text);
    }),
  );
  return map;
}
