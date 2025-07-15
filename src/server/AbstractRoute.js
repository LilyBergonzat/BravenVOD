import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import path, { dirname } from 'node:path';
import { assertArray, assertNumber, assertRecord, assertString } from '../utils/Assert.js';
import { regExpEscape } from '../utils/RegExp.js';
import { Routes } from './WebServer.js';

export class AbstractRoute {
    constructor() {
        if (this.constructor === AbstractRoute) {
            throw new Error('You cannot instantiate an abstract route.');
        }

        if (!this.run) {
            throw new Error('The run method must be implemented on every route.');
        }
    }

    async render(
        template,
        response,
        variables = {},
        code = 200,
        errorMessage = null
    ) {
        assertString(template);
        assertRecord(variables, 'string', 'string');
        assertNumber(code);

        if (code >= 400 && code < 600 && errorMessage) {
            console.error(`[WEBSERVER ROUTE ERROR] ${errorMessage}`);
        }

        response.send(await this.getHTMLTemplate(template, variables));
        response.status(code);
    }

    async getHTMLTemplate(template, variables = {}) {
        assertString(template);
        assertRecord(variables, 'string', 'string');

        const templatePath = AbstractRoute.getPublicPath('templates', template);
        let htmlTemplate = await fs.readFile(templatePath, 'utf8');

        for (const [key, value] of Object.entries(variables)) {
            htmlTemplate = htmlTemplate.replace(
                new RegExp(`\\{\\{\\s*${regExpEscape(key)}\\s*\\}\\}`, 'gu'),
                value
            );
        }

        return htmlTemplate;
    }

    redirectToTwitchAuth(request, response) {
        const authURL = 'https://id.twitch.tv/oauth2/authorize';
        const authParams = new URLSearchParams({
            client_id: process.env.TWITCH_CLIENT_ID,
            redirect_uri: this.getURL(request, Routes.TwitchAuth),
            response_type: 'code',
        });

        return response.redirect(`${authURL}?${authParams}`);
    }

    isTwitchAdmin(username) {
        return process.env.ADMIN_TWITCH_USERNAMES.toLowerCase().split(',').includes(username.toLowerCase());
    }

    getURL(request, path) {
        return `${request.protocol + '://' + request.get('host')}${path}`;
    }

    static getPublicPath(...relativePath) {
        assertArray(relativePath, 'string');

        const thisPath = dirname(fileURLToPath(import.meta.url));

        return path.join(thisPath, 'public', ...relativePath);
    }
}
