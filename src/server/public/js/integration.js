let player;

const onPlayerReady = (event) => {
    event.target.playVideo();
};

const initPlayer = (videoId, startSeconds) => {
    player = new YT.Player('player', {
        videoId,
        playerVars: {
            'playsinline': 1,
            'start': startSeconds,
            'controls': 0,
            'rel': 0,
        },
        events: {
            'onReady': onPlayerReady,
        }
    });
};

const newVideo = (videoId, startSeconds) => {
    if (player) {
        player.loadVideoById(videoId, startSeconds);
    } else {
        initPlayer(videoId, startSeconds);
    }
};

const newVideoHandler = ({ videoId, startSeconds }) => {
    newVideo(videoId, startSeconds);
};

const seekHandler = ({ videoId, time }) => {
    if (!player || !player.getVideoData) {
        return;
    }

    if (player.getVideoData().video_id !== videoId) {
        newVideo(videoId, time);
        return;
    }

    player.seekTo(time);
};

const playHandler = ({ videoId, time }) => {
    if (!player || !player.getVideoData) {
        return;
    }

    if (player.getVideoData().video_id !== videoId) {
        newVideo(videoId, time);
        return;
    }

    const currentTime = Math.floor(player.getCurrentTime());

    if (currentTime - 1 > time || currentTime + 1 < time) {
        player.seekTo(time);
    }

    player.playVideo();
}

const pauseHandler = ({ videoId, time }) => {
    if (!player) {
        return;
    }

    if (player.getVideoData().video_id !== videoId) {
        newVideo(videoId, time);
        return;
    }

    player.seekTo(time);
    player.pauseVideo();
};

const messageHandler = message => {
    switch (message.action) {
        case 'newVideo':
            newVideoHandler(message.data);
            break;

        case 'seek':
            seekHandler(message.data);
            break;

        case 'play':
            playHandler(message.data);
            break;

        case 'pause':
            pauseHandler(message.data);
            break;
    }
};

const wsConnect = () => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('Connected to WS');
    };

    ws.onclose = () => {
        console.log('Disconnected from WS. Reconnecting...');
        wsConnect();
    };

    ws.onmessage = message => {
        messageHandler(JSON.parse(message.data));
    };
};

wsConnect();


