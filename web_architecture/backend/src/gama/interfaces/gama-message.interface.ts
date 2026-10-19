export interface GamaMessage<T> {
    type: string;
    content: T;
    command?: unknown;
}