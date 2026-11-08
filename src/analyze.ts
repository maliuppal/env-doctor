import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseEnvExample } from './env-file.js';
import { scanSourceForEnv } from './scan.js';
import { listSourceFiles, readSources } from './walk.js';

export type FailOn = 'missing' | 'unused' | 'any';

export interface EnvDoctorOptions {
  root?: string;
  envExamplePath?: string;
  ignore?: string[];
}

export interface EnvDoctorReport {
  usedInCode: string[];
  documented: string[];
  missingInExample: string[];
  unusedInCode: string[];
  ok: boolean;
  /** Resolved path to the env example file that was read (or attempted). */
  envExamplePath: string;
  /** False when the env example file does not exist (all keys treated as undocumented). */
  envExampleFound: boolean;
}

/**
 * Compare env usage in source against `.env.example`.
 */
export async function analyzeEnv(options: EnvDoctorOptions = {}): Promise<EnvDoctorReport> {
  const root = path.resolve(options.root ?? process.cwd());
  const envPath = path.resolve(options.envExamplePath ?? path.join(root, '.env.example'));
  const ignore = options.ignore ?? [];

  let documented = new Set<string>();
  let envExampleFound = false;
  try {
    await access(envPath);
    envExampleFound = true;
    const example = await readFile(envPath, 'utf8');
    documented = parseEnvExample(example);
  } catch {
    documented = new Set();
  }

  const files = await listSourceFiles(root, ignore);
  const sources = await readSources(files);
  const used = new Set<string>();
  for (const text of sources.values()) {
    for (const k of scanSourceForEnv(text)) used.add(k);
  }

  const missingInExample = [...used].filter((k) => !documented.has(k)).sort();
  const unusedInCode = [...documented].filter((k) => !used.has(k)).sort();

  return {
    usedInCode: [...used].sort(),
    documented: [...documented].sort(),
    missingInExample,
    unusedInCode,
    ok: missingInExample.length === 0 && unusedInCode.length === 0,
    envExamplePath: envPath,
    envExampleFound,
  };
}

export function shouldFail(report: EnvDoctorReport, failOn: FailOn): boolean {
  if (failOn === 'missing') return report.missingInExample.length > 0;
  if (failOn === 'unused') return report.unusedInCode.length > 0;
  return !report.ok;
}
