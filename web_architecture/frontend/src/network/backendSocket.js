import {io} from 'socket.io-client';

export const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to backend: ', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from backend');
});
