# env-doctor

Source: [github.com/maliuppal/env-doctor](https://github.com/maliuppal/env-doctor)

Keep **`.env.example` in sync with your code**—find env vars used in source but missing from the example file, and keys documented but never used. **CI exit codes**, `--suggest` to fix drift. Supports `process.env`, `process.env['KEY']`, Vite `import.meta.env`, and `const { X } = process.env`. Zero runtime dependencies.

```bash
npm install @ali.uppal/env-doctor
npx env-doctor . --fail-on missing
```

## Example output

```text
Env file: /app/.env.example
Used in code: 4
In .env.example: 2

Missing in .env.example:
  - DATABASE_URL
  - VITE_API_BASE

Unused in code:
  - LEGACY_FLAG
```

Exit code **1** when `--fail-on` matches (ideal for GitHub Actions and pre-commit).

## CLI examples

```bash
# Fail CI if code references vars not in .env.example
env-doctor . --fail-on missing

# Only warn on stale docs, not extra keys in .env.example
env-doctor . --fail-on missing

# Skip tests and vendor trees
env-doctor . --fail-on missing --ignore '**/*.test.ts' 'vendor/**'

# Custom template file
env-doctor . --env-example .env.sample

# Print KEY= lines to paste into .env.example
env-doctor . --fail-on missing --suggest

# Machine-readable report for dashboards
env-doctor . --json
```

### `--fail-on` modes

| Mode | Fails when |
| --- | --- |
| `missing` | Code uses a var not listed in `.env.example` |
| `unused` | `.env.example` lists a var never referenced in code |
| `any` | Either mismatch (default) |

## Library examples

```ts
import { analyzeEnv, shouldFail, suggestEnvExampleLines } from '@ali.uppal/env-doctor';

const report = await analyzeEnv({
  root: process.cwd(),
  envExamplePath: '.env.example',
  ignore: ['**/*.test.ts'],
});

if (shouldFail(report, 'missing')) {
  console.error('Missing:', report.missingInExample);
  process.exit(1);
}

// Copy-paste into .env.example
console.log(suggestEnvExampleLines(report.missingInExample).join('\n'));
```

```ts
import { scanSourceForEnv, parseEnvExample } from '@ali.uppal/env-doctor';

scanSourceForEnv("const u = process.env['API_URL']");
// => Set { 'API_URL' }

parseEnvExample('API_URL=\n# comment\nDEBUG=false\n');
// => Set { 'API_URL', 'DEBUG' }
```

**Note:** Dynamic keys like `process.env[name]` are not detected—use dot, bracket, or destructuring with literal names.

## CI

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 22
- run: npm ci
  working-directory: apps/web
- run: npx env-doctor . --fail-on missing --ignore '**/*.test.ts'
  working-directory: apps/web
```

## Why teams pick this

**vs manual grep / dotenv linters:** one pass over real source (including Vite), diff against `.env.example`, non-zero exit in CI, and `--suggest` for quick fixes—no extra SaaS.

**Search terms (npm):** env-doctor, dotenv, environment variables, env example, env sync, `.env.example`, `.env.sample`, vite env, import.meta.env, process.env, twelve-factor, devops, github actions, ci, pre-commit, onboarding, typescript, node, cli
