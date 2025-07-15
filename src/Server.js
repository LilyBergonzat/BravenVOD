import { configDotenv } from 'dotenv';
import { WebServer } from './server/WebServer.js';
import { WSServer } from './server/WSServer.js';

configDotenv({ quiet: true });

let instance;
let webServer;
let wsServer;

export class Server {
    constructor() {
        if (instance) {
            return instance;
        }

        webServer = new WebServer();
        wsServer = new WSServer();

        instance = this;
    }

    async init() {
        await webServer.init();
        await wsServer.init();

        console.log(`Web server listening on port ${Number(process.env.WEB_SERVER_PORT)}`);
        console.log(`WebSocket server listening on port ${Number(process.env.WEBSOCKET_SERVER_PORT)}`);
    }
}

await new Server().init();
