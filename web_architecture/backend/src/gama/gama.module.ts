import { Module } from '@nestjs/common';
import { GamaService } from './gama.service';

@Module({
    providers: [GamaService],
    exports: [GamaService],
})
export class GamaModule {}
