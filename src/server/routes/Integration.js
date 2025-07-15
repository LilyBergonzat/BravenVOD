import { AbstractRoute } from '../AbstractRoute.js';

export default class extends AbstractRoute {
    async run(request, response) {
        return this.render('integration.html', response, {
            wsHost: request.hostname,
            wsPort: process.env.WEBSOCKET_SERVER_PORT,
        });
    }
}