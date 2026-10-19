export interface GamaVariable {
    name: string;
    type: string;
}

export interface GamaSpecies {
    name: string;
    variables: GamaVariable[];
}