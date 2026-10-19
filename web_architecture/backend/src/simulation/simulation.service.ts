import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { GamaService } from '../gama/gama.service';
import { sleep } from '../common/utils/async.util';
import { SimulationState } from '../common/enums/simulation-state.enum';
import { SimulationMode } from '../common/enums/simulation-mode.enum';
import { MapBounds, SimulationInitialization } from '../gama/interfaces/gama-simulation-initialization.interface';
import type { FeatureCollection } from 'geojson';
import { SimulationGateway } from '../gateway/simulation/simulation.gateway';

@Injectable()
export class SimulationService {
    private state: SimulationState;
    private mode: SimulationMode;
    private currentCycle: number;
    private updateDelay: number;
    private mapBounds: MapBounds;
    private allSpecies: Record<string, FeatureCollection>;
    private dynamicSpecies: Record<string, FeatureCollection>;
    private reloadRequested: boolean;
    private stopRequested: boolean;
    private simulationLoop?: Promise<void>;

    constructor(
        private readonly gamaService: GamaService,
        private readonly gateway: SimulationGateway
    ) {
        this.state = SimulationState.UNINITIALIZED;
        this.mode = SimulationMode.STEP;
        this.currentCycle = 0;
        this.updateDelay = 25;
        this.mapBounds = [
            [0, 0],
            [0, 0]
        ];
        this.allSpecies = {};
        this.dynamicSpecies = {};
        this.reloadRequested = false;
        this.stopRequested = false;
    }

    // ===== START: INITIALIZATION =====
    async initialize(): Promise<SimulationInitialization> {
        try {
            // Ensure ongoing simulation loop is stopped before reinitializing
            if (this.simulationLoop) {
                this.stopRequested = true;
                await this.simulationLoop;
                console.log('Ongoing simulation loop stopped before reinitialization.');
            }

            // GAMA connection and Model loading
            await this.gamaService.initialize();

            // Reset runtime cache for a new simulation session
            this.currentCycle = 0;
            this.setDynamicSpecies({});

            // Set map center and zoom
            this.mapBounds = await this.gamaService.getMapBounds();

            // Initial species render
            this.allSpecies = await this.gamaService.getAllSpeciesGeoJSON();

            // Initial cycle
            this.setCurrentCycle(await this.gamaService.getCycle());

            this.setState(SimulationState.STOPPED);
            console.log("Simulation service initialized successfully.");

            return {
                mapBounds: this.mapBounds,
                allSpecies: this.allSpecies,
                mode: this.mode,
                ...this.gamaService.getSpeciesListInfo()
            };
        } catch (error) {
            console.error("Error initializing Simulation service:", error);
            this.setState(SimulationState.ERROR);
            throw error;
        }
    }
    // ===== END: INITIALIZATION =====

    // ===== START: SIMULATION LIFECYCLE =====
    async start(): Promise<void> {
        this.refreshStateFromGama();
        console.log(`currentCycle: ${this.currentCycle}, state: ${this.state}, dynamicSpecies: ${Object.keys(this.dynamicSpecies).length}`);
        
        switch (this.state) {
            case SimulationState.RUNNING:
                return;

            case SimulationState.PAUSED:
            case SimulationState.STOPPED:
                break;

            case SimulationState.ERROR:
            case SimulationState.UNINITIALIZED:
                throw new Error(`Simulation is in ${this.state} state. Reinitialize first.`);
        }

        this.stopRequested = false;
        this.reloadRequested = false;
        this.setState(SimulationState.RUNNING);

        // To prevent multiple loops from being started, check if a loop is already running
        if (this.simulationLoop) {
            throw new Error("Simulation loop is already running.");
        }

        console.log(`Simulation starting in ${this.mode} mode.`);
        if (this.mode === SimulationMode.STEP) {
            this.simulationLoop = this.runStepLoop();
        } else if (this.mode === SimulationMode.PLAY) {
            await this.gamaService.play();
            this.simulationLoop = this.runPlayLoop();
        }
    }

    async pause(): Promise<void> {
        this.refreshStateFromGama();

        switch (this.state) {
            case SimulationState.RUNNING:
                break;
            case SimulationState.STOPPED:
            case SimulationState.PAUSED:
                return;

            default:
                throw new Error(`Cannot pause simulation while in state: ${this.state}`);
        }

        await this.gamaService.pause();
        this.setState(SimulationState.PAUSED);
        console.log('Simulation paused.');
    }

    async step(): Promise<void> {
        this.refreshStateFromGama();

        if (
            this.state !== SimulationState.STOPPED &&
            this.state !== SimulationState.PAUSED
        ) {
            throw new Error(`Cannot step simulation while in state: ${this.state}`);
        }

        // Avoid case state PAUSED during the polling loop
        if (this.simulationLoop) {
            await this.simulationLoop;
        }

        const previousCycle = this.currentCycle;
        await this.gamaService.step();
        this.setCurrentCycle(await this.waitForNextCycle(previousCycle));
        await this.updateDynamicSpecies();
        this.setState(SimulationState.PAUSED);
    }

    async stop(): Promise<void> {
        this.refreshStateFromGama();

        switch (this.state) {
            case SimulationState.UNINITIALIZED:
                throw new Error(`Cannot stop simulation while in state: ${this.state}`);
            default:
                break;
        }

        // If the simulation is running, defer the stop
        if (this.state === SimulationState.RUNNING) {
            this.stopRequested = true;
            await this.simulationLoop;
            console.log('Simulation stopped.');
            return;
        }
        
        // Otherwise, stop immediately
        await this.gamaService.stop();
        this.setState(SimulationState.UNINITIALIZED);
        this.setCurrentCycle(0);
        this.setDynamicSpecies({});
        console.log('Simulation stopped.');
    }

    async cleanup(): Promise<void> {
        try {
            if (this.state !== SimulationState.UNINITIALIZED) {
                await this.stop();
            }
        } finally {
            // Close the GAMA connection.
            await this.gamaService.ensureCleanState();

            this.setCurrentCycle(0);
            this.setDynamicSpecies({});
            this.setState(SimulationState.UNINITIALIZED);

            console.log('GAMA session cleaned up.');
        }
    }

    async reload(): Promise<void> {
        this.refreshStateFromGama();

        switch (this.state) {
            case SimulationState.UNINITIALIZED:
                throw new Error("Simulation must be initialized before reloading.");
            default:
                break;
        }

        // If the simulation is running, defer the reload
        if (this.simulationLoop) {
            this.reloadRequested = true;
            if (this.mode === SimulationMode.STEP) {
                await this.simulationLoop;
            }
            return;
        }
        
        // Otherwise, reload immediately
        await this.gamaService.reload();
        this.setCurrentCycle(0);
        await this.updateDynamicSpecies();
        this.setState(SimulationState.STOPPED);
        console.log('Simulation reloaded.');
    }

    setMode(mode: SimulationMode): {mode: SimulationMode} {
        this.refreshStateFromGama();

        if (!Object.values(SimulationMode).includes(mode)) {
            throw new BadRequestException(`Unsupported simulation mode: ${mode}`);
        }

        if (this.state !== SimulationState.PAUSED && this.state !== SimulationState.STOPPED) {
            throw new ConflictException(`Cannot change mode while simulation is ${this.state}`);
        }

        this.mode = mode;
        this.gateway.emitSimulationMode(mode);
        console.log(`Simulation mode changed to ${mode}.`);
        return { mode: this.mode };
    }
    // ===== END: SIMULATION LIFECYCLE =====

    // ===== START: RUNNING MODE =====
    async runStepLoop(): Promise<void> {
        try {
            while (this.state === SimulationState.RUNNING) {
                try {
                    await this.gamaService.step();

                    // Wait for GAMA to finalize the cycle before fetching new data
                    this.setCurrentCycle(await this.waitForNextCycle(this.currentCycle));

                    // Update cached dynamic species data
                    await this.updateDynamicSpecies();

                    const reloaded = await this.handleLifecycleRequests();

                    if (reloaded) {
                        // Exit loop as GAMA does not support running step mode after a reload
                        this.setState(SimulationState.STOPPED);
                        break;
                    }
                } catch (error) {
                    console.error('Simulation step loop error:', error);
                    this.setState(SimulationState.ERROR);
                }

                // Control simulation speed
                await sleep(this.updateDelay);
            }
        } finally {
            this.simulationLoop = undefined;
        }
    }

    async runPlayLoop(): Promise<void> {
        try {
            while (this.state === SimulationState.RUNNING) {
                try {
                    this.ensureExperimentRunning();

                    await this.updateDynamicSpecies();

                    const cycle = await this.gamaService.getCycle();
                    if (cycle !== this.currentCycle) {
                        this.setCurrentCycle(cycle);
                    }

                    const reloaded = await this.handleLifecycleRequests();
                    if (reloaded) {
                        // Continue polling as GAMA continues after reload in play mode
                        continue;
                    }
                } catch (error) {
                    console.error('Simulation play loop error:', error);
                    this.setState(SimulationState.ERROR);
                }

                // Pulling interval
                await sleep(this.updateDelay);
            }
        } finally {
            this.simulationLoop = undefined;
        }
    }
    // ===== END: RUNNING MODE =====

    // ===== START: HANLDE CACHED DYNAMIC SPECIES DATA =====
    async updateDynamicSpecies(): Promise<void> {
        this.setDynamicSpecies(await this.gamaService.getDynamicSpeciesGeoJSON());
    }

    getDynamicSpecies(): Record<string, FeatureCollection> {
        return this.dynamicSpecies;
    }
    // ===== END: HANDLE CACHED DYNAMIC SPECIES DATA =====

    // ===== START: CYCLE SYNCHRONIZATION =====
    async waitForNextCycle(prevCycle: number): Promise<number> {
        const timeout = 30000;
        const start = Date.now();

        while (!this.stopRequested && !this.reloadRequested) {
            const currentCycle = await this.gamaService.getCycle();

            if (currentCycle > prevCycle) {
                return currentCycle;
            }

            // Timed out if GAMA simulation is no longer running
            if (Date.now() - start > timeout) {
                throw new Error("Timed out waiting for simulation cycle to advance.");
            }

            // Avoid tight loop
            await sleep(10);
        }

        // Return the previous cycle if stop or reload is requested
        console.log('Cycle synchronization stopped.');
        return prevCycle; 
    }
    // ===== END: CYCLE SYNCHRONIZATION =====

    // ===== START: HELPERS =====
    private refreshStateFromGama(): void {
        if (!this.gamaService.isConnected()) {
            this.setState(SimulationState.UNINITIALIZED);
            return;
        }

        if (this.gamaService.getExperimentState() === 'NONE') {
            this.setState(SimulationState.UNINITIALIZED);
        }
    }

    private async handleLifecycleRequests(): Promise<boolean> {
        if (this.stopRequested) {
            await this.gamaService.stop();
            this.setState(SimulationState.UNINITIALIZED);
            this.setCurrentCycle(0);
            this.setDynamicSpecies({});
            this.stopRequested = false;
            return false;
        }

        if (this.reloadRequested) {
            await this.gamaService.reload();
            this.setCurrentCycle(0);
            await this.updateDynamicSpecies();
            this.reloadRequested = false;
            console.log('Simulation reloaded.');
            return true;
        }

        return false;
    }

    private ensureExperimentRunning(): void {
        if (this.gamaService.getExperimentState() !== 'RUNNING') {
            throw new Error(`GAMA unexpectedly left RUNNING state (${this.gamaService.getExperimentState()}).`);
        }
    }

    private setState(state: SimulationState): void {
        this.state = state;
        this.gateway.emitSimulationState(state);
    }

    private setCurrentCycle(cycle: number): void {
        this.currentCycle = cycle;
        this.gateway.emitCurrentCycle(cycle);
    }

    private setDynamicSpecies(dynamicSpecies: Record<string, FeatureCollection>): void {
        this.dynamicSpecies = dynamicSpecies;
        this.gateway.emitDynamicSpecies(dynamicSpecies);
    }
    // ===== END: HELPERS =====
}
