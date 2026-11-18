import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SimulationModule } from './simulation/simulation.module';
import { GamaModule } from './gama/gama.module';
import { GatewayModule } from './gateway/simulation/gateway.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        SimulationModule, 
        GamaModule, 
        GatewayModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
