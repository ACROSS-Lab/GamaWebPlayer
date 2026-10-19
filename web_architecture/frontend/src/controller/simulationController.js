import {addSpeciesLayer, updateSpeciesLayer} from '../map/species.js'
import { createLayerPanel } from '../ui/layerPanel.js';
import { socket } from '../network/backendSocket.js';
import * as backendApi from "../network/backendApi.js";

class SimulationController {
    constructor() {
        this.map = null;
        this.state = "UNINITIALIZED";
        this.stateListeners = new Set();
        this.currentCycle = 0;
        this.mode = "play";
        this.modeListeners = new Set();
        this.cycleListeners = new Set();
    }

    // ===== START: INITIALIZATION =====
    async initialize(map) {
        try {
            this.map = map;

            socket.on('simulationState', (state) => {
                this.setState(state);
            });

            socket.on('currentCycle', (cycle) => {
                this.setCurrentCycle(cycle);
            });

            socket.on('simulationMode', (mode) => {
                this.setMode(mode);
            });

            // GAMA connection and Model loading
            // This returns mapCenter, allSpecies, speciesList, hiddenSpecies, dynamicSpecies, staticSpecies 
            const initData = await backendApi.initialize();
            this.setState("STOPPED");

            // Set simulation mode
            this.setMode(initData.mode);

            // Set map center and zoom
            this.map.fitBounds(initData.mapBounds, {
                padding: 40,
                duration: 0,
                maxZoom: 20
            })

            // Initial species render
            for (const [species, geojson] of Object.entries(initData.allSpecies)) {
                addSpeciesLayer(this.map, species, geojson);
            }

            // Create layer panel
            createLayerPanel(this.map, initData.speciesList, initData.hiddenSpecies);

            socket.on('dynamicSpecies', (dynamicSpecies) => {
                this.updateMap(dynamicSpecies);
            });

            // Setup browser lifcycle
            this.setupBrowserLifecycle();

            console.log("SimulationController initialized successfully.");
        } catch (error) {
            console.error("Error initializing SimulationController:", error);
            throw error;
        }
    }
    // ===== END: INITIALIZATION =====

    // ===== START: SIMULATION LIFECYCLE =====
    async start() {
        await backendApi.start();
    }

    async pause() {
        await backendApi.pause();
    }

    async stop() {
        await backendApi.stop();
    }

    async reload() {
        await backendApi.reload();
    }

    async step() {
        await backendApi.step();
    }
    // ===== END: SIMULATION LIFECYCLE =====

    // ===== START: MAP UPDATE =====
    updateMap(dynamicData) {
        for (const [species, geojson] of Object.entries(dynamicData)) {
            updateSpeciesLayer(this.map, species, geojson);
        }
    }
    // ===== END: MAP UPDATE =====

    // ===== START: BROWSER LIFECYCLE =====
    setupBrowserLifecycle() {
        window.addEventListener("beforeunload", () => {
            console.log("Cleaning GAMA states");

            const cleanupRequest = backendApi.cleanup();

            if (!cleanupRequest) {
                console.error("Could not queue GAMA cleanup request");
            }
        })
    }
    // ===== END: BROWSER LIFECYCLE =====

    // ===== START: STATE LISTENERS FOR UI COMPONENTS =====
    setState(state) {
        this.state = state;

        for (const listener of this.stateListeners) {
            listener(state);
        }
    }

    onStateChange(listener) {
        this.stateListeners.add(listener);
        listener(this.state);

        return () => this.stateListeners.delete(listener);
    }

    setCurrentCycle(cycle) {
        if (this.currentCycle === cycle) {
            return;
        }

        this.currentCycle = cycle;

        for (const listener of this.cycleListeners) {
            listener(cycle);
        }
    }

    onCycleChange(listener) {
        this.cycleListeners.add(listener);
        listener(this.currentCycle);

        return () => this.cycleListeners.delete(listener);
    }
    // ===== END: STATE LISTENERS FOR UI COMPONENTS =====
    
    // ===== START: PLAY MODE CONTROL =====
    async changeMode(mode) {
        const result = await backendApi.setMode(mode);
        this.setMode(result.mode);
    }

    setMode(mode) {
        if (this.mode === mode) {
            return;
        }
        this.mode = mode;

        for (const listener of this.modeListeners) {
            listener(mode);
        }
    }

    // In case of host/viewers
    onModeChange(listener) {
        this.modeListeners.add(listener);
        listener(this.mode);

        return () => this.modeListeners.delete(listener);
    }
    // ===== END: PLAY MODE CONTROL =====
}

export const simulationController = new SimulationController();