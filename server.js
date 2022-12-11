// server.js
import { handler } from './dist/handler.js';
import express from 'express';

const app = express();

// Enable cross origin isolation for simulator SharedBuffers
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    res.append('Cross-Origin-Opener-Policy', 'same-origin');
    res.append('Cross-Origin-Embedder-Policy', 'require-corp');
    res.append('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(3000, () => {
    console.log('Node app is running on port 3000');
});