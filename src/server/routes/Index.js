import { AbstractRoute } from '../AbstractRoute.js';

export default class extends AbstractRoute {
    async run(request, response) {
        console.log(`JSON file requested by ${request.ip} | ${request.method} ${request.url}`);
        response.sendFile('videos.json', { root: '.' });
    }
}