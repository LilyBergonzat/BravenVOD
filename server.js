import { configDotenv } from 'dotenv';
import express from 'express';
import cors from 'cors';

configDotenv({ quiet: true });

const app = express();

app.use(cors());
app.set('trust proxy', Number(process.env.TRUST_PROXY) ?? 0);

app.get('/', (req, res) => {
    console.log(`JSON file requested by ${req.ip} | ${req.method} ${req.url}`);
    res.sendFile('videos.json', { root: '.' });
});

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Listening on port ${process.env.SERVER_PORT}`);
})