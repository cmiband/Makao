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
const gamesWithDecks = new Map();

let basicDeck = ['2karo','2kier','2trefl','2pik',
                    '3karo', '3kier', '3trefl', '3pik',
                    '4karo', '4kier', '4trefl', '4pik',
                    '5karo', '5kier', '5trefl', '5pik',
                    '6karo', '6kier', '6trefl', '6pik',
                    '7karo', '7kier', '7trefl', '7pik',
                    '8karo', '8kier', '8trefl', '8pik',
                    '9karo', '9kier', '9trefl', '9pik',
                    '10karo', '10kier', '10trefl', '10pik',
                    'jopekkaro', 'jopekkier', 'jopektrefl', 'jopekpik',
                    'damakaro', 'damakier', 'damatrefl', 'damapik',
                    'krolkaro', 'krolkier', 'kroltrefl', 'krolpik',
                    'askaro', 'askier', 'astrefl', 'aspik'];


app.use(express.static(__dirname));
app.use(favicon(__dirname+'/public/graphics/favicon.ico'));

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname, 'index.html'))
});

app.get('/lobbyowner', (req,res)=>{
    res.sendFile(path.join(__dirname, 'lobby.html'))
});

app.get('/lobby', (req,res)=>{
    res.sendFile(path.join(__dirname, 'lobbyUserSide.html'))
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
        createLobby(socket, uname, lname);
    });

    socket.on('lobbyPageLoaded', (uname) => {
        setUpLobby(socket, uname);
    });

    socket.on('join-lobby-attempt', (uname, lname)=>{
        joiningLobbyAttempt(socket, uname, lname);
    });

    socket.on('user-joined-lobby', (uname, lname)=>{
        userJoiningLobby(socket, uname, lname);
    });

    socket.on('add-to-list-attempt', (uname, lname)=>{
        addToListRequests(uname,lname);
    });

    socket.on('owner-started-game', (lname) => {
        ownerStartsGame(lname);
    });

    socket.on('request-deck', (lname) => {
        sendShuffledDeck(lname);
        sendHandToEachUser(lname);
    });
});

const setUpLobby = (socket, uname) => {
    addUser(socket.id, uname);

    socket.join(getKeyByValue(availableLobbys, uname));
}

const createLobby = (socket, username, lobbyname) =>{
    let temp = availableLobbys.get(lobbyname);
    let tempTwo = getKeyByValue(availableLobbys, username);

    if(temp !== undefined || tempTwo !== undefined){
        socket.emit('lobby-error');

        return;
    }
    else{
        addLobby(lobbyname,username);
        addUserToSpecificLobby(lobbyname, username);

        socket.emit('load-lobby-owner-page');
    }
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

const addDeckToGame = (lname, deck) => {
    gamesWithDecks.set(lname, deck);
}

const changeDeckOfTheGame = (lname, deck) => {
    gamesWithDecks.set(lname, deck);
}

const onDisconnect = (socket) => {
    console.log(`user with id ${socket.id} disconnected`);

    let uname = users.get(socket.id);
    if(uname === undefined){
        return;
    }
    let lnameByUser = getKeyByValueInArray(lobbysWithUsers, uname);
    users.delete(socket.id);

    if(lnameByUser !== undefined){
        let lobbyOwnerName = availableLobbys.get(lnameByUser);

        if(lobbyOwnerName == uname){
            io.to(lnameByUser).emit('owner-left-kick-all');

            availableLobbys.delete(lnameByUser);
            lobbysWithUsers.delete(lnameByUser);

            console.log(`owner with id: ${socket.id} left`);

            console.log(availableLobbys);
        }
        else{     
            let usersInLobby = lobbysWithUsers.get(lnameByUser);
            let temp = arrayRemove(usersInLobby, uname);
            lobbysWithUsers.delete(lnameByUser);
            lobbysWithUsers.set(lnameByUser, temp);

            io.to(lnameByUser).emit('remove-user-from-list', uname);

            console.log(`member with id: ${socket.id} left`);
            console.log(availableLobbys);
        }

        if(gamesWithDecks.get(lnameByUser) !== undefined){
            gamesWithDecks.delete(lnameByUser);
        }
    }
}

const joiningLobbyAttempt = (socket, uname, lname) => {
    console.log(`${uname} tries to join lobby named ${lname}`);
    
    if(availableLobbys.has(lname)){
        let temp = lobbysWithUsers.get(lname);
        if(temp.includes(uname)){
            socket.emit('username-taken');

            return;
        }
        socket.emit('lobby-found');
        addUserToSpecificLobby(lname,uname);

        console.log(availableLobbys);
    }
    else{
        socket.emit('lobby-not-existing');
    }
}

const userJoiningLobby = (socket, uname, lname) => {
    addUser(socket.id, uname);
    let lobbyOwnerName = availableLobbys.get(lname);

    socket.join(lname);
    let usersAlreadyIn = lobbysWithUsers.get(lname);

    socket.emit('user-info-receiver', lobbyOwnerName, usersAlreadyIn);
}

const addToListRequests = (uname, lname) => {
    io.to(lname).emit('add-to-list', uname);
}

const ownerStartsGame = (lname) => {
    io.to(lname).emit('load-game-for-lobby');
}

const sendShuffledDeck = (lname) => {
    let shuffledDeck = shuffle(basicDeck);
    let deckSendable = shuffledDeck.join(',');

    addDeckToGame(lname, deckSendable);
}

const sendHandToEachUser = (lname) => {
    let deck = gamesWithDecks.get(lname);
    let deckArr = deck.split(',');
    let usersNicks = lobbysWithUsers.get(lname);
    let lobbySize = usersNicks.length;
    let counter = 0;

    for(const user of usersNicks){
        let userId = getKeyByValue(users, user);
        let cards = [];

        for(let i = 0; i<5; i++){
            let card = deckArr[i*lobbySize+counter];
            cards.push(card);
        }
        
        io.to(userId).emit('hand-sent', cards.join(','));
        deckArr = deleteCardsFromDeck(cards, lname);
        counter++;
    }

    io.to(lname).emit('deck-sent', deckArr.join(','));
    changeDeckOfTheGame(lname, deckArr.join(','));
    console.log('deck sent to lobby');
    
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

const shuffle = (arr) => {
    let currentIndex = arr.length,  randomIndex;
  
    while (currentIndex != 0) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [arr[currentIndex], arr[randomIndex]] = [
        arr[randomIndex], arr[currentIndex]];
    }
  
    return arr;
}

const deleteCardsFromDeck = (cards, lname) => {
    let deck = gamesWithDecks.get(lname);
    let deckAsArray = deck.split(',');
    for(const card of cards){
        let temp = arrayRemove(deckAsArray, card);
        deckAsArray = temp;
    }

    return deckAsArray;
}