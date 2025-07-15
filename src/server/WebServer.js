import express from 'express';
import cors from 'cors';
import session from 'express-session';
import fs from 'node:fs';
import https from 'node:https';

let initialized = false;
let instance;

export const folderExtensionMap = {
    css: ['css'],
    js: ['js'],
    font: ['woff', 'woff2', 'eot', 'ttf'],
    img: ['svg', 'png'],
};

const staticFolders = Object.keys(folderExtensionMap).map(
    str => str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
);

const staticRequestRegex = new RegExp(
    `\/(?:(?<dir>${staticFolders.join('|')})\/.+|robots\.txt|favicon\.ico)`,
    'u'
);

export const Routes = {
    Index: '/',
    Static: staticRequestRegex,
    Control: '/control',
    Integration: '/integration',
    TwitchAuth: '/twitch-auth',
};

export class WebServer {
    app = express();

    constructor() {
        if (instance) {
            return instance;
        }

        instance = this;
    }

    async init() {
        if (initialized) {
            return;
        }

        this.initMiddlewares();
        await this.initRoutes();

        return this.initServer()
    }

    initMiddlewares() {
        if (initialized) {
            return;
        }

        this.app.use(cors());
        this.app.set('trust proxy', Number(process.env.TRUST_PROXY) ?? 0);
        this.app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: true,
            cookie: { secure: true }
        }));
    }

    async initRoutes() {
        if (initialized) {
            return;
        }

        for (const route of Object.keys(Routes)) {
            const routeClass = await import(`./routes/${route}.js`);
            const routeInstance = new routeClass.default();

            this.app.get(Routes[route], async (request, response, next) => {
                return routeInstance.run(request, response, next);
            });
        }
    }

    initServer() {
        if (initialized) {
            return;
        }

        return new Promise(resolve => {
            if (Number(process.env.HTTPS) === 1) {
                const privateKey = fs.readFileSync('ssl/server.key', 'utf8');
                const certificate = fs.readFileSync('ssl/server.crt', 'utf8');
                const credentials = { key: privateKey, cert: certificate };

                if (process.env.HTTPS_PASSPHRASE) {
                    credentials.passphrase = process.env.HTTPS_PASSPHRASE;
                }

                https.createServer(credentials, this.app).listen(Number(process.env.WEB_SERVER_PORT));

                initialized = true;
                resolve();
            } else {
                this.app.listen(Number(process.env.WEB_SERVER_PORT), () => {
                    initialized = true;
                    resolve();
                });
            }
        });
    }
}