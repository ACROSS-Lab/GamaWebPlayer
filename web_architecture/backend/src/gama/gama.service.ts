import { Injectable } from '@nestjs/common';
import GamaClient from '@gama-platform/gama-client';
import type { FeatureCollection } from 'geojson';
import { normalizeColor, extractOpacity } from '../common/utils/color.util';
import { GamaDescription } from './interfaces/gama-description.interface';
import { GamaSpecies } from './interfaces/gama-species.interface';
import { GamaMessage } from './interfaces/gama-message.interface';
import type { MapBounds } from './interfaces/gama-simulation-initialization.interface';

@Injectable()
export class GamaService {
    private client: GamaClient;
    private modelPath: string;
    private experimentName: string;
    private speciesList: string[];
    private staticSpecies: string[];
    private dynamicSpecies: string[];
    private hiddenSpecies: string[];

    constructor() {
        this.client = new GamaClient(1000, 'localhost');
        this.modelPath =
            'C:/workspace/gama/gama.library/models/Toy Models/Waterflow/models/Waterflow Grid Elevation.gaml';
        this.experimentName = 'hydro';
        this.speciesList = [];
        this.staticSpecies = [];
        this.dynamicSpecies = [];
        this.hiddenSpecies = [];
    }

    // ===== START: INITIALIZATION =====
    async initialize(): Promise<void> {
        try {
            await this.ensureCleanState();
            await this.connect();
            await this.loadModel();
            await this.initSpecies();
            console.log('GAMA Service initialized successfully');
        } catch (error) {
            console.error('Error initializing GAMA Service:', error);
            throw error;
        }
    }

    async ensureCleanState(): Promise<void> {
        try {
            if (this.client.isConnected()) {
                if (this.client.getExperimentState() !== 'NONE') {
                    await this.client.stop();
                }
                await this.client.closeConnection();
            }
        } catch (error) {
            console.error('Cleanup error: ', error);
            throw error;
        }
    }
    // ===== END: INITIALIZATION =====

    // ===== START: GAMA CONNECTION =====
    async connect(): Promise<boolean> {
        await this.client.connectGama();
        return this.client.isConnected();
    }

    async loadModel(): Promise<void> {
        try {
            await this.client.loadExperiment(
                this.modelPath,
                this.experimentName,
            );
            console.log('Model loaded');
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }
    // ===== END: GAMA CONNECTION =====

    // ===== START: SPECIES INITIALIZATION =====
    async initSpecies(): Promise<void> {
        this.clearCachedSpecies();

        let orderedSpeciesNames: string[] = [];
        let detectedSpecies: GamaSpecies[] = [];
        const speciesMap: Map<string, GamaSpecies> = new Map();
        let orderedSpecies: GamaSpecies[] = [];

        try {
            try {
                // Case there's an exported list
                const response = (await this.client.expression(
                    'species_list',
                )) as unknown as GamaMessage<string[]>;
                orderedSpeciesNames = response.content || [];
            } catch {
                console.log(
                    'No species_list found, falling back to describe() order',
                );
            }

            // Always get species metadata to detect hidden/dynamic species
            const description = (await this.client.describe(
                this.modelPath,
            )) as unknown as GamaMessage<GamaDescription>;
            const descriptionContent = description.content;
            const worldName = descriptionContent.name;
            detectedSpecies = descriptionContent.species.filter((species) =>
                species.variables.some(
                    (variable) =>
                        variable.name === 'host' && variable.type === worldName,
                ),
            );
        } catch (error) {
            console.error('Error fetching species metadata from GAMA:', error);
            throw error;
        }

        for (const species of detectedSpecies) {
            speciesMap.set(species.name, species);
        }

        if (orderedSpeciesNames.length > 0) {
            orderedSpecies = orderedSpeciesNames.map((name) => {
                const species = speciesMap.get(name);
                if (!species) {
                    throw new Error(
                        `Species "${name}" from species_list was not found in the model description.`,
                    );
                }
                return species;
            });
        } else {
            orderedSpecies = detectedSpecies;
        }

        for (const species of orderedSpecies) {
            const speciesName = species.name;
            const hasShowInClient = species.variables.some(
                (variable) => variable.name === 'showInClient',
            );
            const hasMoveInClient = species.variables.some(
                (variable) => variable.name === 'moveInClient',
            );

            // Hides if showInClient exists
            if (hasShowInClient) {
                this.hiddenSpecies.push(speciesName);
                continue;
            }
            this.speciesList.push(speciesName);

            // Dynamic if moveInClient exists
            if (hasMoveInClient) {
                this.dynamicSpecies.push(speciesName);
            } else {
                this.staticSpecies.push(speciesName);
            }
        }
        console.log('Static species:', this.staticSpecies);
        console.log('Dynamic species:', this.dynamicSpecies);
        console.log('Hidden species:', this.hiddenSpecies);
    }
    // ===== END: SPECIES INITIALIZATION =====

    // ===== START: GEOJSON DATA RETRIEVAL =====
    async getSingleSpeciesGeoJSON(speciesName: string): Promise<FeatureCollection> {
        const parsedContent = await this.getSpeciesGeoJSON(speciesName, ["location", "color", "wireframe"]);

        try {
            // Normalize colors
            if (parsedContent.features) {
                parsedContent.features.forEach(feature => {
                    if (!feature.properties) {
                        feature.properties = {};
                    }

                    if (feature.properties?.color) {
                        feature.properties.color = normalizeColor(
                            feature.properties.color
                        );
                        feature.properties.opacity = extractOpacity(
                            feature.properties.color
                        );
                    } else {
                        feature.properties.color = "#000000";
                        feature.properties.opacity = 0;
                    }
                });
            }

            return parsedContent;
        } catch (error) {
            console.error(`Error normalizing species color for ${speciesName}:`, error);
            return parsedContent;
        }
    }

    async getAllSpeciesGeoJSON(): Promise<Record<string, FeatureCollection>> {
        const result = {};

        for (const species of this.speciesList) {
            result[species] = await this.getSingleSpeciesGeoJSON(species);
        }
        return result;
    }

    async getDynamicSpeciesGeoJSON(): Promise<Record<string, FeatureCollection>> {
        const result = {};

        for (const species of this.dynamicSpecies) {
            result[species] = await this.getSingleSpeciesGeoJSON(species);
        }
        return result;
    }
    // ===== END: GEOJSON DATA RETRIEVAL =====

    // ===== START: SIMULATION CONTROL =====
    async play(): Promise<void> {
        await this.client.play();
    }

    async pause(): Promise<void> {
        await this.client.pause();
    }

    async stop(): Promise<void> {
        await this.client.stop();
    }

    async step(nb_step: number = 1, sync: boolean = true): Promise<void> {
        await this.client.step(nb_step, sync);
    }

    async reload(): Promise<void> {
        await this.client.reload();
    }

    async getCycle(): Promise<number> {
        try {
            const cycle = (await this.client.expression(
                'cycle',
            )) as unknown as GamaMessage<number>;
            return cycle.content;
        } catch (error) {
            console.error('Error fetching cycle:', error);
            throw error;
        }
    }
    // ===== END: SIMULATION CONTROL =====

    // ===== START: HELPERS =====
    async getMapBounds(): Promise<MapBounds> {
        const response = (await this.client.expression(
            'to_geojson(world.shape, "EPSG:4326", [])'
        ))as unknown as GamaMessage<string>;

        const worldGeoJson = typeof response.content === 'string'
            ? JSON.parse(response.content)
            : response.content;

        const geometry = worldGeoJson.features[0]?.geometry;
        if (!geometry || geometry.type !== 'Polygon') {
            throw new Error('GAMA world shape did not produce a Polygon');
        }

        const outerRing = geometry.coordinates[0];
        if (!outerRing?.length) {
            throw new Error('GAMA world shape has no coordinates');
        }

        const longitudes = outerRing.map(position => position [0]);
        const latitudes = outerRing.map(position  => position [1]);

        return [
            [Math.min(...longitudes), Math.min(...latitudes)], 
            [Math.max(...longitudes), Math.max(...latitudes)] 
        ];
    }

    async getSpeciesGeoJSON(speciesName: string, properties: string[] = []): Promise<FeatureCollection> {
        const speciesData = (await this.client.expression(
            `to_geojson(${speciesName}, "EPSG:4326", ${JSON.stringify(properties)})`
        )) as unknown as GamaMessage<string>;
        const content = speciesData.content;
        if (!content || content === "" || content === "null") {
            console.warn(`No data found for species: ${speciesName}`);
            return { type: "FeatureCollection", features: [] };
        }

        try {
            const parsedContent = typeof content === "string"
                ? JSON.parse(content)
                : content;

            return parsedContent;
        } catch (error) {
            console.error(`Error parsing GeoJSON for species: ${speciesName}`, error);
            return { type: "FeatureCollection", features: [] };
        }
    }

    private clearCachedSpecies(): void {
        this.speciesList.length = 0;
        this.staticSpecies.length = 0;
        this.dynamicSpecies.length = 0;
        this.hiddenSpecies.length = 0;
    }

    isConnected(): boolean {
        return this.client.isConnected();
    }

    getExperimentState(): 'NONE' | 'RUNNING' | 'PAUSED' | 'NOTREADY' {
        return this.client.getExperimentState();
    }

    getSpeciesListInfo(): {
        speciesList: string[];
        staticSpecies: string[];
        dynamicSpecies: string[];
        hiddenSpecies: string[];
    } {
        return {
            speciesList: this.speciesList,
            staticSpecies: this.staticSpecies,
            dynamicSpecies: this.dynamicSpecies,
            hiddenSpecies: this.hiddenSpecies,
        }
    }
    // ===== END: HELPERS =====
}
