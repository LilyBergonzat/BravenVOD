import { AbstractRoute } from '../AbstractRoute.js';
import { Routes } from '../WebServer.js';

export default class extends AbstractRoute {
    async run(request, response) {
        if (!request.query.code) {
            return this.redirectToTwitchAuth(request, response);
        }

        const tokenURL = 'https://id.twitch.tv/oauth2/token';
        const tokenParams = new URLSearchParams({
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            code: request.query.code,
            grant_type: 'authorization_code',
            redirect_uri: this.getURL(request, '/twitch-auth'),
        });

        const tokenResponse = await fetch(`${tokenURL}?${tokenParams}`, { method: 'POST' });

        if (!tokenResponse.ok) {
            console.error('Error authenticating Twitch account');
            console.log(await tokenResponse.text());

            return this.redirectToTwitchAuth(request, response);
        }

        const tokenData = await tokenResponse.json();
        const token = tokenData.access_token;

        const userURL = 'https://api.twitch.tv/helix/users';
        const userResponse = await fetch(userURL, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID,
            }
        });

        if (!userResponse.ok) {
            console.error('Error authenticating Twitch account');
            console.log(await userResponse.text());

            return this.redirectToTwitchAuth(request, response);
        }

        const userData = await userResponse.json();

        request.session.twitchLogin = userData.data[0].login;
        response.redirect(Routes.Control);
    }
}