const defaultWebOrigins = ['http://localhost:5173', 'http://localhost:5174'];

export function readCorsOrigins(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.WEB_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured?.length ? configured : defaultWebOrigins;
}
