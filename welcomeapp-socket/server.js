'use strict';

const
    http = require('http'),
    koa = require('koa'),
    bodyParser = require('koa-body'),
    cors = require('koa-cors'),
    corsError = require('koa-cors-error'),
    socketUrl = process.env.SOCKET_URL || `http://localhost:5002`,
    app = module.exports = koa();

app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    headers: ['Content-Type', 'Authorization', 'x-xsrf-token', 'Access-Control-Allow-Origin', 'ignoreToken'],
}));
app.use(bodyParser({
    multipart: true,
    urlencoded: true
}));
app.use(corsError)

const server = http.createServer(app.callback()).listen(5002, () => {
    console.log(`Socket Http Server ${socketUrl}`)
});

const io = require('socket.io').listen(server)
io.origins('*:*')

let connectedClients = []

io.on('connection', (socket) => {
    let clientConnectionId = socket.id

    socket.on('join', (data) => {
        let user = {
            user: data.userId,
            company: data.company,
            connectionId: clientConnectionId
        }
        connectedClients[clientConnectionId] = user
        console.log('A user logged in ', connectedClients)
    });

    socket.on('new-challenge-avaliable', (arrayOfUsersId) => {
        Object.keys(connectedClients).forEach(clientKey => {
            if (arrayOfUsersId.findIndex(id => id == connectedClients[clientKey].user) != -1)
                io.to(clientKey).emit('new-challenge-notify-user')
        })
        console.log(`Socket: new-challenge-avaliable emitted for ${arrayOfUsersId.length} users.`);
    });

    socket.on('remove-challenge', () => {
        socket.broadcast.emit('remove-challenge-notify')
        console.log('Socket: remove-challenge-notify emitted.');
    });

    socket.on('new-mission-avaliable', (arrayOfUsersId, mission) => {
        Object.keys(connectedClients).forEach(clientKey => {
            if (arrayOfUsersId.findIndex(id => id == connectedClients[clientKey].user) != -1)
                io.to(clientKey).emit('new-mission-notify-user', mission)
        })
        console.log(`Socket: new-mission-avaliable emitted for ${arrayOfUsersId.length} users.`);
    });

    socket.on('mission-updated', (arrayOfUsersId, mission) => {
        Object.keys(connectedClients).forEach(clientKey => {
            if (arrayOfUsersId.findIndex(id => id == connectedClients[clientKey].user) != -1)
                io.to(clientKey).emit('mission-updated-notify-user', mission)
        })
        console.log(`Socket: mission-status-updated emitted for ${arrayOfUsersId.length} users.`);
    });

    socket.on('mission-status-updated', (arrayOfUsersId, mission) => {
        Object.keys(connectedClients).forEach(clientKey => {
            if (arrayOfUsersId.findIndex(id => id == connectedClients[clientKey].user) != -1)
                io.to(clientKey).emit('mission-status-updated-notify-user', mission)
        })
        console.log(`Socket: mission-status-updated emitted for ${arrayOfUsersId.length} users.`);
    });

    socket.on('remove-mission', (arrayOfUsersId, mission) => {
        Object.keys(connectedClients).forEach(clientKey => {
            if (arrayOfUsersId.findIndex(id => id == connectedClients[clientKey].user) != -1)
                io.to(clientKey).emit('remove-mission-notify-user', mission)
        })
        console.log(`Socket: remove-mission-notify-user emitted for ${arrayOfUsersId.length} users.`);
    });

    socket.on('remove-attachments', (files) => {
        socket.broadcast.emit('remove-attachments-from-s3', files)
        console.log('Socket: remove-attachments-from-s3 emitted.');
    });

    socket.on('disconnect', () => {
        delete connectedClients[clientConnectionId]
        console.log('A user has been disconnected ', connectedClients)
    });
});
