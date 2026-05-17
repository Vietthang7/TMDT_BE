import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ──────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Cookie Parser ────────────────────────────────
  app.use(cookieParser());

  // ── Validation pipe (class-validator / class-transformer) ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── CORS ───────────────────────────────────────────
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3001', 'http://localhost:5173'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // ── Swagger ────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Fitness E-Commerce API')
    .setDescription(
      'API for a fitness supplements & equipment e-commerce platform',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── Start ──────────────────────────────────────────
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
