/**
 * Parse `.env.example` style files (KEY=value, comments and blanks ignored).
 */
export function parseEnvExample(content: string): Set<string> {
  const keys = new Set<string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    const key = (eq === -1 ? trimmed : trimmed.slice(0, eq)).trim();
    if (/^[A-Z_][A-Z0-9_]*$/.test(key)) keys.add(key);
  }
  return keys;
}

/** Lines to append when keys are missing from `.env.example`. */
export function suggestEnvExampleLines(keys: string[]): string[] {
  return keys.map((k) => `${k}=`);
}

export function formatEnvExampleAppend(keys: string[]): string {
  if (keys.length === 0) return '';
  const body = keys.map((k) => `${k}=\n`).join('');
  return `\n# suggested by env-doctor\n${body}`;
}
