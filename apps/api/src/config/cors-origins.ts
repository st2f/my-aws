export const viteLocalhostOrigin = /^http:\/\/localhost:517\d+$/;

export function readCorsOrigins(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.WEB_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...(configured ?? []), viteLocalhostOrigin];
}
