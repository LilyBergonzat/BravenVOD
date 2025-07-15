import forwarded from 'forwarded-for';
import { createHash } from 'node:crypto';
import { WebSocketServer } from 'ws';

let initialized = false;
let instance;
let server;

export class WSServer {
    constructor() {
        if (instance) {
            return instance;
        }

        instance = this;
    }

    init() {
        if (initialized) {
            return;
        }

        server = new WebSocketServer({
            port: Number(process.env.WEBSOCKET_SERVER_PORT),
        });

        server.on('connection', (socket, request) => {
            socket.on('message', message => {
                this.socketMessageHandler(request, message);
            });
        });

        initialized = true;
    }

    socketMessageHandler(request, message) {
        const readableMessage = typeof message === 'string' ? message : message.toString();
        const messageData = JSON.parse(readableMessage);

        if (!messageData.key) {
            return;
        }

        const address = forwarded(request, request.headers, []);
        const keyData = `${address.ip}:${process.env.SESSION_SECRET}`;
        const correctKey = createHash('sha256').update(keyData).digest('base64');

        if (messageData.key !== correctKey) {
            return;
        }

        delete messageData.key;

        this.messageHandler(messageData);
    }

    messageHandler(data) {
        server.clients.forEach(client => {
            client.send(JSON.stringify(data));
        })
    }
}