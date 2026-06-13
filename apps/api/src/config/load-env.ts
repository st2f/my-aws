import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config as loadDotenv } from 'dotenv';

export function loadEnvFile(startDirectory = process.cwd()) {
  const path = findEnvFile(startDirectory);

  if (!path) {
    return;
  }

  loadDotenv({ path, override: false, quiet: true });
}

export function findEnvFile(startDirectory: string) {
  let current = startDirectory;

  while (true) {
    const candidate = join(current, '.env');

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);

    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

loadEnvFile();
