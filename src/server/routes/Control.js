import { createHash } from 'node:crypto';
import { AbstractRoute } from '../AbstractRoute.js';
import forwarded from 'forwarded-for';

export default class extends AbstractRoute {
    async run(request, response) {
        if (!request.session.twitchLogin) {
            return this.redirectToTwitchAuth(request, response);
        }

        if (!this.isTwitchAdmin(request.session.twitchLogin)) {
            response.status(403);
            return response.send('You do not have the permission to access this page.');
        }

        const address = forwarded(request, request.headers, []);
        const keyData = `${address.ip}:${process.env.SESSION_SECRET}`;
        const key = createHash('sha256').update(keyData).digest('base64');

        return this.render('control.html', response, {
            wsURL: process.env.WEBSOCKET_URL,
            key,
            aggregatorJsonURL: process.env.AGGREGATOR_JSON_URL,
        });
    }
}
