import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // Static WebUI build + SPA fallback (manual: full control, no extra module).
  const webuiDir = join(__dirname, 'webui');
  app.use(express.static(webuiDir));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.method !== 'GET') return next();
    res.sendFile(join(webuiDir, 'index.html'));
  });

  app.enableShutdownHooks();
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`HakkuAuto ready on http://localhost:${port}`);
}

void bootstrap();
