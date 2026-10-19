import './style.css'
import { createMap } from './map/map.js';
import {simulationController} from './controller/simulationController.js';
import { createSimulationControlPanel } from './ui/simulationControlPanel.js';

// ---------- Create map with default center ----------
const map = createMap();

// ---------- Create simulation control panel ----------
createSimulationControlPanel(simulationController);

map.on('load', async () => {
    // ===== START: MAPPING GAMA-MAPLIBRE DYNAMICALLY =====
    try {
        await simulationController.initialize(map);
    } catch (error) {
        console.error("Failed to initialize GAMA:", error);
    }
    // ===== END: MAPPING GAMA-MAPLIBRE DYNAMICALLY =====
});
