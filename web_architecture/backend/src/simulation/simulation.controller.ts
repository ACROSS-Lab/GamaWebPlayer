import { Controller, Post, Get, Body } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulationMode } from '../common/enums/simulation-mode.enum';

@Controller('simulation')
export class SimulationController {
    constructor(private readonly simulationService: SimulationService) {}

    @Post('initialize')
    initialize() {
        return this.simulationService.initialize();
    }

    @Post('start')
    start() {
        return this.simulationService.start();
    }

    @Post('pause')
    pause() {
        return this.simulationService.pause();
    }

    @Post('stop')
    stop() {
        return this.simulationService.stop();
    }

    @Post('cleanup')
    cleanup() {
        return this.simulationService.cleanup();
    }

    @Post('reload')
    reload() {
        return this.simulationService.reload();
    }

    @Post('step')
    step() {
        return this.simulationService.step();
    }

    @Post('setMode')
    setMode(@Body() body: { mode: SimulationMode }) {
        return this.simulationService.setMode(body.mode);
    }

    // Remove later
    @Get('getDynamicSpecies')
    getDynamicSpecies() {
        return this.simulationService.getDynamicSpecies();
    }
}
