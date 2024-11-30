import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

import dbHelper from './modules/dbHelper.js';
import userModule from './modules/user.js';
import feedModule from './modules/feed.js';
import vaccineModule from './modules/vaccine.js';
import calendarModule from './modules/calendar.js';
import toolModule from './modules/tool.js';
import { Status } from './constants.js';
import { port, secretKey, dbConnectionString } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __clientPath = path.join(__dirname, '../client');

dotenv.config();
dbHelper.connect(dbConnectionString);

const app = express();
app.use(express.json());
app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      },
    })
  );
  

// Basic rate limiter: limits each IP to 3 requests per second
const basicLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 10, // limit each IP to 3 requests per windowMs
    message: {
        error: 'Too many requests, please try again after a minute.'
    }
});

const processGetAPI = async (req, res) => {
    const { module, action, id } = req.params;
    const data = { ...req.body, ...req.query };
    switch (module) {
        case 'feed':
            switch (action) {
                case 'get-task': {
                    let responseData = await feedModule.getTask(dbHelper, data.taskId);
                    return res.status(responseData.status).json(responseData);
                }
                case 'get-all-tasks': {
                    let responseData = await feedModule.getTasks(dbHelper, req.session, data.taskId);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'vaccine':
            switch (action) {
                case 'get-task': {
                    let responseData = await vaccineModule.getTask(dbHelper, data.taskId);
                    return res.status(responseData.status).json(responseData);
                }
                case 'get-all-tasks': {
                    let responseData = await vaccineModule.getTasks(dbHelper, req.session, data.taskId);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'schedule':
            switch (action) {
                case 'get-all-schedules': {
                    let responseData = await calendarModule.getSchedules(dbHelper, req.session);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'tool':
            switch (action) {
                case 'get-all-stocks': {
                    let responseData = await toolModule.getStocks(dbHelper, req.session);
                    return res.status(responseData.status).json(responseData);
                }
                case 'get-stock': {
                    let responseData = await toolModule.getStock(dbHelper, data.stockId);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        default:
            return res.status(404).json({ error: 'Unknown module' });
    }
};

const processPostAPI = async (req, res) => {
    const { module, action, id } = req.params;
    const data = { ...req.body, ...req.query };
    switch (module) {
        case 'user': 
            switch (action) {
                case 'register': {
                    let responseData = { status: Status.OK };
                    responseData = await userModule.register(dbHelper, req.session, data); 
                    return res.status(responseData.status).json(responseData);
                }
                case 'login': {
                    let responseData = { status: Status.OK };
                    responseData = await userModule.login(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'logout': {
                    let responseData = await userModule.logout(req.session);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'feed':
            switch (action) {
                case 'create-task': {
                    let responseData = await feedModule.createTask(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'update-task': {
                    let responseData = await feedModule.updateTask(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'delete-task': {
                    let responseData = await feedModule.deleteTask(dbHelper, req.session, data.taskId);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'vaccine':
            switch (action) {
                case 'create-task': {
                    let responseData = await vaccineModule.createTask(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'update-task': {
                    let responseData = await vaccineModule.updateTask(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'delete-task': {
                    let responseData = await vaccineModule.deleteTask(dbHelper, req.session, data.taskId);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'schedule':
            switch (action) {
                case 'create-schedule': {
                    let responseData = await calendarModule.createSchedule(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        case 'tool':
            switch (action) {
                case 'create-stock': {
                    let responseData = await toolModule.createStock(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'update-stock': {
                    let responseData = await toolModule.updateStock(dbHelper, req.session, data);
                    return res.status(responseData.status).json(responseData);
                }
                case 'delete-stock': {
                    let responseData = await toolModule.deleteStock(dbHelper, req.session, data.stockId);
                    return res.status(responseData.status).json(responseData);
                }
                default:
                    return res.status(404).json({ error: 'Unknown action' });
            }
        default:
            return res.status(404).json({ error: 'Unknown module' });
    }
};

const sessionParser = session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
});

app.use(helmet.frameguard({ action: 'sameorigin' }));

app.use(sessionParser);

app.use(express.static(__clientPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(__clientPath, 'login.html'));
});

app.get('/api/:module/:action', basicLimiter, processGetAPI);

app.post('/api/:module/:action', basicLimiter, processPostAPI);

app.get('/api/:module/:action/:id', basicLimiter, processGetAPI);

app.post('/api/:module/:action/:id', basicLimiter, processPostAPI);

app.use((req, res) => {
    res.redirect('../error-404.html');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
    sessionParser(req, {}, () => {
        // TODO test session on WS after creation of UI
        if (!req.session.userId) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });
});

wss.on('connection', (ws, req) => {
    const userId = req.session.userId;
    console.log(`New client connected: ${userId}`);

    ws.on('message', (message) => {
        console.log(`Received message from ${userId} => ${message}`);
        ws.send(`Hello ${userId}, you sent -> ${message}`);
    });

    ws.on('close', () => {
        console.log(`Client ${userId} has disconnected`);
    });
});

server.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`);
});