import type { FeatureCollection } from 'geojson';
import { SimulationMode } from '../../common/enums/simulation-mode.enum';

export type MapBounds = [
    [number, number], // southwest (min long, min lat)
    [number, number]  // northeast (max long, max lat)
]

export interface SimulationInitialization {
    mapBounds: MapBounds;
    allSpecies: Record<string, FeatureCollection>;
    mode: SimulationMode;
}