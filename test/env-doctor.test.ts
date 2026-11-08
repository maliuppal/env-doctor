import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  analyzeEnv,
  formatEnvExampleAppend,
  parseEnvExample,
  scanSourceForEnv,
  shouldFail,
  suggestEnvExampleLines,
} from '../src/index.js';

describe('env-doctor', () => {
  it('scans process.env', () => {
    const keys = scanSourceForEnv('const x = process.env.API_URL;');
    expect(keys.has('API_URL')).toBe(true);
  });

  it('suggests example lines for missing keys', () => {
    expect(suggestEnvExampleLines(['API_URL', 'DEBUG'])).toEqual(['API_URL=', 'DEBUG=']);
    expect(formatEnvExampleAppend(['API_URL'])).toContain('API_URL=');
    expect(formatEnvExampleAppend([])).toBe('');
  });

  it('parses env example', () => {
    const keys = parseEnvExample('# c\nAPI_URL=\nDEBUG=false\n');
    expect(keys.has('API_URL')).toBe(true);
    expect(keys.has('DEBUG')).toBe(true);
  });

  it('scans import.meta.env', () => {
    const keys = scanSourceForEnv('const x = import.meta.env.VITE_API;');
    expect(keys.has('VITE_API')).toBe(true);
  });

  it('scans bracket and destructuring access', () => {
    const keys = scanSourceForEnv(`
      void process.env['API_KEY'];
      void import.meta.env["VITE_PORT"];
      const { DATABASE_URL, REDIS_URL } = process.env;
    `);
    expect(keys.has('API_KEY')).toBe(true);
    expect(keys.has('VITE_PORT')).toBe(true);
    expect(keys.has('DATABASE_URL')).toBe(true);
    expect(keys.has('REDIS_URL')).toBe(true);
  });

  it('shouldFail modes', () => {
    const report = {
      usedInCode: [],
      documented: [],
      missingInExample: ['A'],
      unusedInCode: ['B'],
      ok: false,
      envExamplePath: '/tmp/.env.example',
      envExampleFound: true,
    };
    expect(shouldFail(report, 'missing')).toBe(true);
    expect(shouldFail(report, 'unused')).toBe(true);
    expect(shouldFail(report, 'any')).toBe(true);
  });

  it('handles missing .env.example', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'env-nofile-'));
    await mkdir(path.join(dir, 'src'), { recursive: true });
    await writeFile(path.join(dir, 'src', 'a.ts'), '', 'utf8');
    const report = await analyzeEnv({ root: dir });
    expect(report.documented).toEqual([]);
    expect(report.envExampleFound).toBe(false);
  });

  it('respects ignore globs', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'env-ign-'));
    await writeFile(path.join(dir, '.env.example'), '', 'utf8');
    await mkdir(path.join(dir, 'vendor'), { recursive: true });
    await writeFile(path.join(dir, 'vendor', 'x.ts'), 'process.env.HIDDEN;\n', 'utf8');
    const report = await analyzeEnv({ root: dir, ignore: ['vendor/**'] });
    expect(report.usedInCode).not.toContain('HIDDEN');
  });

  it('uses custom env example path', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'env-custom-'));
    await writeFile(path.join(dir, 'env.sample'), 'DOC_ONLY=\n', 'utf8');
    await mkdir(path.join(dir, 'src'), { recursive: true });
    await writeFile(path.join(dir, 'src', 'app.ts'), 'void process.env.LIVE;\n', 'utf8');
    const report = await analyzeEnv({
      root: dir,
      envExamplePath: path.join(dir, 'env.sample'),
    });
    expect(report.envExampleFound).toBe(true);
    expect(report.missingInExample).toContain('LIVE');
    expect(report.unusedInCode).toContain('DOC_ONLY');
  });

  it('reports missing and unused', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'env-doc-'));
    await writeFile(path.join(dir, '.env.example'), 'UNUSED=\n', 'utf8');
    await mkdir(path.join(dir, 'src'), { recursive: true });
    await writeFile(path.join(dir, 'src', 'app.ts'), 'void process.env.NEEDED;\n', 'utf8');
    const report = await analyzeEnv({ root: dir });
    expect(report.missingInExample).toContain('NEEDED');
    expect(report.unusedInCode).toContain('UNUSED');
    expect(report.ok).toBe(false);
  });
});
