let ws = new WebSocket(WS_URL);
const randomPickButton = document.querySelector('#random_pick');
let player;

const wsConnect = () => {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('Connected to WS');
    };

    ws.onclose = () => {
        console.log('Disconnected from WS. Reconnecting...');
        wsConnect();
    };
};

const onPlayerReady = (event) => {
    console.log('Player ready');
    event.target.playVideo();
};

// -1 UNSTARTED, 0 ENDED, 1 PLAYING, 2 PAUSED, 3 BUFFERING, 5 CUED
// https://developers.google.com/youtube/iframe_api_reference#Events
const onPlayerStateChange = (event) => {
    const videoId = player.getVideoData().video_id;

    if (event.data === YT.PlayerState.BUFFERING) {
        const time = player.getCurrentTime();

        ws.send(JSON.stringify({
            key: WS_KEY,
            action: 'seek',
            data: {
                videoId,
                time: Math.floor(time),
            },
        }));
    }

    if (event.data === YT.PlayerState.PLAYING) {
        const time = player.getCurrentTime();

        ws.send(JSON.stringify({
            key: WS_KEY,
            action: 'play',
            data: {
                videoId,
                time: Math.floor(time),
            },
        }));
    }

    if (event.data === YT.PlayerState.PAUSED) {
        const time = player.getCurrentTime();

        ws.send(JSON.stringify({
            key: WS_KEY,
            action: 'pause',
            data: {
                videoId,
                time: Math.floor(time),
            },
        }));
    }
}

const initPlayer = (videoId, startSeconds) => {
    player = new YT.Player('player', {
        videoId,
        playerVars: {
            'playsinline': 1,
            'start': startSeconds,
            'rel': 0,
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

const newVideo = (videoId, startSeconds) => {
    ws.send(JSON.stringify({
        key: WS_KEY,
        action: 'newVideo',
        data: {
            videoId,
            startSeconds,
        },
    }));

    if (player) {
        player.loadVideoById(videoId, startSeconds);
    } else {
        initPlayer(videoId, startSeconds);
    }
}

const pickRandomVideo = async () => {
    const vodsResponse = await fetch(AGGREGATOR_JSON_URL);

    if (!vodsResponse.ok) {
        console.error('Could not retrieve VOD data.');
        console.log(vodsResponse);
        console.log(await vodsResponse.text());

        return;
    }

    const vods = await vodsResponse.json();
    const vodIds = Object.keys(vods);
    const randomId = vodIds[Math.floor(Math.random() * vodIds.length)];
    const vod = vods[randomId];
    const [hours, minutes, seconds] = vod.duration.split(':');
    const duration = Math.max((Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds)) - 30, 0);
    const randomStart = Math.floor(Math.random() * duration);

    newVideo(randomId, randomStart);
};

wsConnect();
randomPickButton.addEventListener('click', pickRandomVideo);
