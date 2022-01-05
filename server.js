const express = require('express');
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

    socket.on('disconnect', ()=>{
        onDisconnect(socket);
    });

    socket.on('create-lobby', (uname,lname)=> {
        createLobby(uname, lname);
    });

    socket.on('lobbyPageLoaded', () => {
        sendToLobby(socket);
    });

    socket.on('ownerJoinedLobby', (uname)=>{
        ownerJoined(socket, uname);
    });

    socket.on('owner-leaves', (lname)=>{
        ownerLeft(lname);
    });

    socket.on('join-lobby-attempt', (uname, lname)=>{
        joiningLobbyAttempt(socket, uname, lname);
    });

    socket.on('user-joined-lobby', ()=>{
        userJoiningLobby(socket);
    });

    socket.on('add-to-list-attempt', (uname, lname)=>{
        addToListRequests(uname,lname);
    });
});


const sendToLobby = (socket) => {
    socket.emit('sendInformationToLobby', userName, lobbyName);
}

const createLobby = (username, lobbyname) =>{
    userName = username;
    lobbyName = lobbyname;
    addLobby(lobbyname,username);
    addUserToSpecificLobby(lobbyname, username);
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
    console.log(`user with id ${socket.id} disconnected`);

    let uname = users.get(socket.id);
    if(uname === undefined){
        return;
    }
    let lnameByUser = getKeyByValueInArray(lobbysWithUsers, uname);

    if(lnameByUser !== undefined){
        let usersInLobby = lobbysWithUsers.get(lnameByUser);
        let temp = arrayRemove(usersInLobby, uname);
        lobbysWithUsers.delete(lnameByUser);
        lobbysWithUsers.set(lnameByUser, temp);
    }
}

const ownerJoined = (socket,uname) => {
    addUser(socket.id, uname);

    socket.join(getKeyByValue(availableLobbys, uname));
}

const ownerLeft = (lname) => {
    io.to(lname).emit('owner-left-kick-all');
    availableLobbys.delete(lname);
    lobbysWithUsers.delete(lname);
}

const joiningLobbyAttempt = (socket, uname, lname) => {
    console.log(`${uname} tries to join lobby named ${lname}`);
    
    if(availableLobbys.get(lname) !== undefined){
        socket.emit('lobby-found');
        usersWaitingToJoin.push(uname);
        addUserToSpecificLobby(lname,uname);
    }
}

const userJoiningLobby = (socket) => {
    let nick = usersWaitingToJoin.pop();
    if(nick === undefined){
        return;
    }
    addUser(socket.id, nick);
    let lobbyName = getKeyByValueInArray(lobbysWithUsers, nick);
    let lobbyOwnerName = availableLobbys.get(lobbyName);

    socket.join(lobbyName);

    socket.emit('user-info-receiver', nick, lobbyName, lobbyOwnerName);
}

const addToListRequests = (uname, lname) => {
    io.to(lname).emit('add-to-list', uname, lobbysWithUsers.get(lname));
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

const arrayRemove = (arr, value) => {
    return arr.filter(function(ele){ 
            return ele != value; 
        });
}
