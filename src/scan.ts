const ENV_DOT_RX = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
const META_DOT_RX = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;
const ENV_BRACKET_RX = /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;
const META_BRACKET_RX = /import\.meta\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;
const ENV_DESTRUCT_RX = /\{\s*([^}]+)\s*\}\s*=\s*process\.env\b/g;

const KEY_RX = /^[A-Z_][A-Z0-9_]*$/;

function collectMatches(text: string, rx: RegExp, found: Set<string>): void {
  rx.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    if (m[1]) found.add(m[1]);
  }
}

function collectDestructured(text: string, found: Set<string>): void {
  ENV_DESTRUCT_RX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENV_DESTRUCT_RX.exec(text)) !== null) {
    const inner = m[1];
    if (!inner) continue;
    for (const part of inner.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const head = trimmed.split(/\s*[=:]/)[0]?.trim() ?? '';
      const name = head.replace(/^\.\.\./, '').trim();
      if (KEY_RX.test(name)) found.add(name);
    }
  }
}

/**
 * Extract environment variable names referenced in source text.
 * Supports dot access, bracket access, and simple `const { A, B } = process.env`.
 * Does not resolve dynamic keys (`process.env[name]`).
 */
export function scanSourceForEnv(text: string): Set<string> {
  const found = new Set<string>();
  for (const rx of [ENV_DOT_RX, META_DOT_RX, ENV_BRACKET_RX, META_BRACKET_RX]) {
    collectMatches(text, rx, found);
  }
  collectDestructured(text, found);
  return found;
}
