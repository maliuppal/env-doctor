export { analyzeEnv, shouldFail } from './analyze.js';
export type { EnvDoctorOptions, EnvDoctorReport, FailOn } from './analyze.js';
export { scanSourceForEnv } from './scan.js';
export {
  formatEnvExampleAppend,
  parseEnvExample,
  suggestEnvExampleLines,
} from './env-file.js';
