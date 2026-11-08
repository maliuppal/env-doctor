#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';
import { formatEnvExampleAppend } from './env-file.js';
import { analyzeEnv, shouldFail, type FailOn } from './index.js';
import { readPackageVersion } from './version.js';

function printHelp(): void {
  process.stdout.write(`env-doctor — sync code env usage with .env.example

Usage:
  env-doctor [project-dir] [--env-example <file>] [--json] [--ignore <glob>]
            [--fail-on missing|unused|any] [--suggest]

Options:
  --env-example    Path to .env.example (default: <dir>/.env.example)
  --json           JSON report on stdout
  --suggest        Print lines to append for missing keys (stdout only)
  --ignore         Glob to skip (repeatable)
  --fail-on        CI failure mode (default: any)
  -h, --help
  --version
`);
}

function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      suggest: { type: 'boolean', default: false },
      ignore: { type: 'string', multiple: true, default: [] },
      'env-example': { type: 'string' },
      'fail-on': { type: 'string', default: 'any' },
    },
    allowPositionals: true,
  });

  if (values.version) {
    process.stdout.write(`${readPackageVersion()}\n`);
    return Promise.resolve(0);
  }
  if (values.help) {
    printHelp();
    return Promise.resolve(0);
  }

  const root = path.resolve(positionals[0] ?? process.cwd());
  const failOn = values['fail-on'] as FailOn;

  const envExamplePath = values['env-example']
    ? path.resolve(String(values['env-example']))
  : undefined;

  return analyzeEnv({ root, ignore: values.ignore, envExamplePath }).then((report) => {
    if (values.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      process.stdout.write(`Env file: ${report.envExamplePath}${report.envExampleFound ? '' : ' (not found)'}\n`);
      process.stdout.write(`Used in code: ${String(report.usedInCode.length)}\n`);
      process.stdout.write(`In .env.example: ${String(report.documented.length)}\n`);
      if (report.missingInExample.length) {
        process.stdout.write(`\nMissing in .env.example:\n`);
        for (const k of report.missingInExample) process.stdout.write(`  - ${k}\n`);
      }
      if (report.unusedInCode.length) {
        process.stdout.write(`\nUnused in code:\n`);
        for (const k of report.unusedInCode) process.stdout.write(`  - ${k}\n`);
      }
      if (report.ok) process.stdout.write('\nAll env keys are documented and used.\n');
      if (values.suggest && report.missingInExample.length) {
        process.stdout.write('\nSuggested append:\n');
        process.stdout.write(formatEnvExampleAppend(report.missingInExample));
      }
    }
    return shouldFail(report, failOn) ? 1 : 0;
  });
}

main()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(2);
  });
