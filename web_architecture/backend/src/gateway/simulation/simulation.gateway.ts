import { 
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {SimulationState} from "../../common/enums/simulation-state.enum";
import { SimulationMode } from '../../common/enums/simulation-mode.enum';
import type { FeatureCollection } from 'geojson';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SimulationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    handleConnection(client: Socket) {
        console.log(`Websocket client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Websocket client disconnected: ${client.id}`);
    }

    emitSimulationState(state: SimulationState): void {
        this.server.emit("simulationState", state);
    }

    emitCurrentCycle(cycle: number): void {
        this.server.emit("currentCycle", cycle);
    }

    emitDynamicSpecies(dynamicSpecies: Record<string, FeatureCollection>): void {
        this.server.emit("dynamicSpecies", dynamicSpecies);
    }

    emitSimulationMode(mode: SimulationMode): void {
        this.server.emit("simulationMode", mode);
    }
}
