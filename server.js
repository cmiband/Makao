const express = require('express');
const { appendFileSync } = require('fs');
const app = express();
const server = require('http').createServer(app);
const port = 3000;
const path = require('path');
const io = require('socket.io')(server);
const favicon = require('serve-favicon');

const availableLobbys = new Map();
const lobbysWithUsers = new Map();
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
    console.log("User connected with id: "+socket.id);

    createLobby(socket);

    sendToLobby(socket);

    onDisconnect(socket);

    ownerJoined(socket);

    checkIfUserExistsAndDisconnect(socket);

    joiningLobbyAttempt(socket);

    userJoiningLobby(socket);
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
        addLobby(lname,uname);
        addUserToSpecificLobby(lname, uname);

        console.log(availableLobbys);
    });
}

const addLobby = (lname, uname) => {
    availableLobbys.set(lname, uname);
    lobbysWithUsers.set(lname, []);
}

const addUser = (id,name) => {
    users.set(id,name);
}

const addUserToSpecificLobby = (lname, uname) => {
    lobbysWithUsers.get(lname).push(uname);
}

const onDisconnect = (socket) => {
    socket.on('disconnect', () => {
        console.log(`user with id: ${socket.id} disconnected`);
    });
}

const ownerJoined = (socket) => {
    socket.on('ownerJoinedLobby', (name)=>{
        addUser(socket.id, name);

        socket.join(getKeyByValue(availableLobbys, name));

        console.log(`Owner with name ${name} and id ${socket.id} joined lobby`);

        console.log(users);
    });
}

const joiningLobbyAttempt = (socket) => {
    socket.on('join-lobby-attempt', (uname,lname)=>{
        console.log(`${uname} tries to join lobby named ${lname}`)
        
        if(availableLobbys.get(lname) !== undefined){
            socket.emit('lobby-found');
            addUser(socket.id, uname);
            addUserToSpecificLobby(lname, uname);
        }
    });

    console.log(lobbysWithUsers);
}

const checkIfUserExistsAndDisconnect = (socket) => {
    socket.on('owner-leaves-lobby', (uname,lname) => {
        users.delete(socket.id);
        availableLobbys.delete(lname);
        lobbysWithUsers.delete(lname);
    })
}

const userJoiningLobby = (socket) => {
    socket.on('user-joined-lobby', () => {
        console.log('trying to send informations back to the user...');
        let lastNickInMap = getLastValueInMap(users);
        if(lastNickInMap === false){
            return;
        }
        swapIds(socket, lastNickInMap);

        socket.emit('user-info-receiver', lastNickInMap);
    });
}

const swapIds = (socket, uname) => {
    console.log(users);
    users.delete(getKeyByValue(users, uname));
    users.set(socket.id, uname);
    console.log('swapping....');

    console.log(users);
}

const getKeyByValue = (map, searched) => {
    for(const [key,value] of map.entries()){
        if(value===searched){
            return key;
        }
    }
}

const getLastItemInMap = (map) => [...map][map.size-1];
const getLastKeyInMap = (map) => [...map][map.size-1][0];
const getLastValueInMap = (map) => {
    let tab = [...map][map.size-1];
    if(tab === undefined){
        return false;
    }
    let val = tab[1];
    if(val == undefined){
        return false;
    }

    return val;
}
