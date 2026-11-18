import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ConfiguredIoAdapter } from './config/socket-io.adapter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    const host = config.getOrThrow<string>('BACKEND_HOST');
    const listenPort = Number(config.getOrThrow<string>('BACKEND_LISTEN_PORT'));

    if (!Number.isInteger(listenPort) || listenPort < 1 || listenPort > 65535) {
        throw new Error(
            'BACKEND_LISTEN_PORT must be an integer between 1 and 65535.',
        );
    }

    const allowedOrigins = config
        .getOrThrow<string>('FRONTEND_ORIGINS')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (allowedOrigins.length === 0) {
        throw new Error(
            'FRONTEND_ORIGINS must contain at least one origin.',
        );
    }

    app.enableCors({
        origin: allowedOrigins
    });

    app.useWebSocketAdapter(
        new ConfiguredIoAdapter(app, allowedOrigins)
    );

    await app.listen(listenPort, host);
    console.log(`Backend listening on ${host}:${listenPort}`);
}

bootstrap();
