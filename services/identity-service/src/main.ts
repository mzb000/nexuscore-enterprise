import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { IdentityModule } from './identity.module';
import { GlobalHttpExceptionFilter } from './presentation/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('NexusCore-Identity');
  const app = await NestFactory.create(IdentityModule);

  // Security Headers
  app.use(helmet());
  app.use(cookieParser());

  // Strict Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // RFC 7807 Error Filter
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // CORS Configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexusCore Identity & IAM Service')
    .setDescription('OAuth2.0 PKCE, RS256 JWT Token Rotation, and Redis Session Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4001;
  await app.listen(port);
  logger.log(`NexusCore Identity Service is listening on port: ${port}`);
  logger.log(`OpenAPI documentation available at: http://localhost:${port}/docs`);
}

bootstrap();
