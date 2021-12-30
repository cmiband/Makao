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
let usersWaitingToJoin = [];
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

    ownerLeft(socket);

    joiningLobbyAttempt(socket);

    userJoiningLobby(socket);

    addToListRequests(socket);
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
        let uname = users.get(socket.id);
        if(uname === undefined){
            return;
        }
        users.delete(socket.id);
        let lname = getKeyByValue(availableLobbys, uname);
        if(lname === undefined){
            return;
        }
        availableLobbys.delete(lname);
        lobbysWithUsers.delete(lname);

        console.log(users);
        console.log(availableLobbys);
        console.log(lobbysWithUsers);
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

const ownerLeft = (socket) => {
    socket.on('owner-leaves', (uname, lname) => {
        io.to(lname).emit('owner-left-kick-all');
        availableLobbys.delete(lname);
        lobbysWithUsers.delete(lname);
    });
}

const joiningLobbyAttempt = (socket) => {
    socket.on('join-lobby-attempt', (uname,lname)=>{
        console.log(`${uname} tries to join lobby named ${lname}`)
        
        if(availableLobbys.get(lname) !== undefined){
            socket.emit('lobby-found');
            usersWaitingToJoin.push(uname);
            addUserToSpecificLobby(lname,uname);
        }
    });

    console.log(lobbysWithUsers);
}

const userJoiningLobby = (socket) => {
    socket.on('user-joined-lobby', () => {
        console.log('trying to send informations back to the user...');
        let nick = usersWaitingToJoin.pop();
        if(nick === undefined){
            return;
        }
        addUser(socket.id, nick);
        let lobbyName = getKeyByValueInArray(lobbysWithUsers, nick);
        let lobbyOwnerName = availableLobbys.get(lobbyName);

        socket.join(lobbyName);

        socket.emit('user-info-receiver', nick, lobbyName, lobbyOwnerName);
    });
}

const addToListRequests = (socket) => {
    socket.on('add-to-list-attempt', (uname,lname) => {
        io.to(lname).emit('add-to-list', uname);
    });
}

const getKeyByValue = (map, searched) => {
    for(const [key,value] of map.entries()){
        if(value===searched){
            return key;
        }
    }
}

const getKeyByValueInArray = (map, searched) => {
    for(const [key, values] of map.entries()){
        for(const value of values){
            if(value === searched){
                return key;
            }
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
