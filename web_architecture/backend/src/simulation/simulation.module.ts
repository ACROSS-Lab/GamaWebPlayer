import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { GamaModule } from '../gama/gama.module';
import { GatewayModule } from '../gateway/simulation/gateway.module';

@Module({
    imports: [GamaModule, GatewayModule],
    controllers: [SimulationController],
    providers: [SimulationService],
    exports: [SimulationService],
})
export class SimulationModule {}
