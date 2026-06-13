import 'reflect-metadata';
import './config/load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { readCorsOrigins } from './config/cors-origins.js';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: readCorsOrigins(),
  });
  await app.listen(port, host);
}

void bootstrap();
