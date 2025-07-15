import { configDotenv } from 'dotenv';
import YouTube from 'youtube-api';
import fs from 'node:fs';

configDotenv({ quiet: true });

const videos = fs.existsSync('./videos.json') ? JSON.parse(fs.readFileSync(
    './videos.json',
    { encoding: 'utf8' }
)) : {};

YouTube.authenticate({
    type: 'key',
    key: process.env.API_KEY,
});

const getVideos = () => {
    return new Promise(async (resolve, reject) => {
        const getVideoPage = async (pageToken) => {
            return new Promise((resolve, reject) => {
                const params = {
                    part: 'snippet',
                    channelId: 'UCcx6GVPHVfXigm7ANrVko5A',
                    type: 'video',
                    maxResults: 50,
                    order: 'date',
                    safeSearch: 'none',
                };

                if (pageToken) {
                    params['pageToken'] = pageToken;
                }

                // https://developers.google.com/youtube/v3/docs/search/list#usage
                YouTube.search.list(params, (error, response) => { error ? reject(error) : resolve(response.data) });
            })
        };

        const getVideosDetails = async (ids) => {
            return new Promise((resolve, reject) => {
                const params = {
                    part: 'id,contentDetails',
                    id: ids.join(','),
                    maxResults: 50,
                };

                // https://developers.google.com/youtube/v3/docs/videos/list
                YouTube.videos.list(params, (error, response) => { error ? reject(error) : resolve(response.data) });
            })
        };

        const newVideos = Object.keys(videos).filter(id => !videos[id].duration);
        let needToContinue = true;
        let pageToken;
        let page = 1;

        do {
            const pageResult = await getVideoPage(pageToken).catch(reject);

            pageToken = pageResult?.nextPageToken;
            needToContinue = !pageResult.items.some(item => item.id.videoId in videos);

            pageResult?.items.filter(item => !(item.id.videoId in videos)).forEach(item => {
                videos[item.id.videoId] = { title: item.snippet.title };
                newVideos.push(item.id.videoId);
            });

            if (!pageToken) {
                console.log(pageResult);
            }

            page++;
        } while (needToContinue && pageToken);

        console.log(`Found ${newVideos.length} new video(s)`);

        const videosDetails = await getVideosDetails(newVideos);
        const durationRegex = /^PT(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?$/u;

        for (const details of videosDetails.items) {
            if (!videos[details.id] || !details.contentDetails?.duration) {
                continue;
            }

            const durationDetails = durationRegex.exec(details.contentDetails.duration);

            if (!durationDetails.groups) {
                continue;
            }

            const hours = (durationDetails.groups.hours ?? '0').padStart(2, '0');
            const minutes = (durationDetails.groups.minutes ?? '0').padStart(2, '0');
            const seconds = (durationDetails.groups.seconds ?? '0').padStart(2, '0');

            videos[details.id].duration = `${hours}:${minutes}:${seconds}`;
        }

        resolve(videos);
    });
}

await getVideos();

fs.writeFileSync('./videos.json', JSON.stringify(videos, null, 4));