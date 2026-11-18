import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

export class ConfiguredIoAdapter extends IoAdapter {
    constructor(
        app: INestApplicationContext,
        private readonly allowedOrigins: string[],
    ) {
        super(app);
    }

    createIOServer(
        port: number,
        options?: Partial<ServerOptions>,
    ): Server {
        return super.createIOServer(port, {
            ...options,
            cors: {
                origin: this.allowedOrigins,
            },
        }) as Server;
    }
}