const express = require('express');
const { add } = require('nodemon/lib/rules');
const app = express();
const server = require('http').createServer(app);
const port = 3000;
const path = require('path');
const io = require('socket.io')(server);
const favicon = require('serve-favicon');

const availableLobbys = new Map();
const users = new Map();
let userName;
let lobbyName;

app.use(favicon(__dirname+'/public/graphics/favicon.ico'));
app.use(express.static(__dirname));

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'))
});

server.listen(port, () => {
    console.log("Listening on port "+port);
});

io.on('connection', socket => {
    console.log("User connected with id: "+socket.id)

    createLobby(socket);

    sendToLobby(socket);

    onDisconnect(socket);

    ownerJoined(socket);
});


const sendToLobby = (socket) => {
    socket.on('lobbyPageLoaded', () => {
        socket.emit('sendInformationToLobby', userName, lobbyName);
        console.log("Sending information to lobby");
    });
}

const createLobby = (socket) =>{
    socket.on('create-lobby', (uname, lname) => {
        userName = uname;
        lobbyName = lname;
        console.log(`Player username: ${uname}, Lobby title: ${lname}`);
        addLobby(uname,lname);
    });

    console.log(availableLobbys);
    console.log(users);
}

const addLobby = (uname, lname) => {
    availableLobbys.set(uname, lname);
}

const addUser = (id,name) => {
    users.set(id,name);
}

const onDisconnect = (socket) => {
    socket.on('disconnect', () => {
        console.log(`user with id: ${socket.id} disconnected`);
    });
}

const ownerJoined = (socket) => {
    socket.on('ownerJoinedLobby', (name)=>{
        addUser(name, socket.id);

        console.log(`Owner with name ${name} and id ${socket.id}`);
    })
}