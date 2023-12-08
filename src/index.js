const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Chat = require('./models/Chat'); // Import the Mongoose model

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/index.html'));

mongoose.connect('mongodb://localhost/mongochat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

db.once('open', () => {
    console.log('MongoDB successfully connected via Mongoose...');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('input', (data) => {
        const name = data.name;
        const message = data.message;

        if (!name || !message) {
            socket.emit('status', 'Please enter a name and message');
        } else {
            const chatMessage = new Chat({ name, message });

            chatMessage.save((err) => {
                if (err) {
                    throw err;
                }

                io.emit('output', [data]);

                socket.emit('status', {
                    message: 'Message sent',
                    clear: true,
                });
            });
        }
    });

    socket.on('clear', () => {
        Chat.deleteMany({}, (err) => {
            if (err) {
                throw err;
            }
            socket.emit('cleared');
        });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
