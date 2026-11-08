import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Read version from package.json next to compiled CLI (works for ESM + CJS bins). */
export function readPackageVersion(): string {
  try {
    const entry = process.argv[1];
    if (!entry) return '0.0.0';
    const pkgPath = join(dirname(entry), '..', 'package.json');
    const parsed: unknown = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (parsed && typeof parsed === 'object' && 'version' in parsed) {
      return (parsed as { version: string }).version;
    }
  } catch {
    // ignore
  }
  return '0.0.0';
}
