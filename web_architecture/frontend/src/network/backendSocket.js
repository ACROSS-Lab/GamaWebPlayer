import {io} from 'socket.io-client';
import { BACKEND_URL } from '../config.js';

export const socket = io(BACKEND_URL);

socket.on('connect', () => {
    console.log('Connected to backend: ', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from backend');
});
