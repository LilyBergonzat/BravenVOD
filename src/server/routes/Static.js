import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AbstractRoute } from '../AbstractRoute.js';
import { folderExtensionMap } from '../WebServer.js';

const robotsTxtHandler = (response) => {
    response
        .status(200)
        .set('Content-Type', 'text/plain')
        .send('User-agent: *\nDisallow: /\n');
};

const faviconIcoHandler = (response) => {
    response
        .status(200)
        .set('Content-Type', 'image/x-icon')
        .sendFile('favicon.ico', { root: './src/server/public/img' });
};

const extensionMimeTypeMap = {
    css: 'text/css',
    js: 'text/javascript',
    woff: 'font/woff',
    woff2: 'font/woff2',
    eot: 'application/vnd.ms-fontobject',
    ttf: 'application/font-sfnt',
    svg: 'image/svg+xml',
    png: 'image/png',
};

export default class extends AbstractRoute {
    async run(request, response, next) {
        if (request.url.startsWith('/robots.txt')) {
            robotsTxtHandler(response);
            return;
        }

        if (request.url.startsWith('/favicon.ico')) {
            faviconIcoHandler(response);
            return;
        }

        const rootPath = path.join(dirname(dirname(fileURLToPath(import.meta.url))), 'public');
        const requestedPath = path.join(rootPath, request.url);
        const absolutePath = path.resolve(rootPath, requestedPath);
        const filePath = path.relative(rootPath, absolutePath);
        const correctExtensions = folderExtensionMap[request.params.dir] ?? [request.params.dir];
        const extension = filePath.slice(filePath.lastIndexOf('.') + 1).toLowerCase();

        if (!fs.existsSync(absolutePath) || !correctExtensions.includes(extension)) {
            console.error(`Invalid request: ${request.url} // ${filePath} // ${absolutePath}`);
            return next();
        }

        response.set('Content-Type', extensionMimeTypeMap[extension] ?? 'text/plain');

        return response.sendFile(filePath, { root: rootPath });
    }
}