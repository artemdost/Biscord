const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

io.on('connection', socket => {
    console.log('Новый пользователь подключен');

    socket.on('join', (data) => {
        socket.join(data.roomId);
        socket.to(data.roomId).emit('new-user', data);
    });

    socket.on('offer', (offer) => {
        socket.to('12345').emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.to('12345').emit('answer', answer);
    });

    socket.on('ice-candidate', (candidate) => {
        socket.to('12345').emit('ice-candidate', candidate);
    });

    socket.on('leave', (data) => {
        socket.leave(data.roomId);
    });

    // Обработка текстовых сообщений
    socket.on('chatMessage', (message) => {
        socket.broadcast.emit('chatMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключен');
    });
});

server.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
