import { AbstractRoute } from '../AbstractRoute.js';

export default class extends AbstractRoute {
    async run(request, response) {
        return this.render('integration.html', response, {
            wsURL: process.env.WEBSOCKET_URL,
        });
    }
}
