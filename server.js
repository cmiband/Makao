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
const gamesWithTopCard = new Map();
const gamesWithPlayersTurn = new Map();
const gamesWithMoves = new Map();

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

    socket.on('kick-player-request', (lname, pname)=>{
        kickFromLobby(pname,lname);
        console.log(`${lname} wants to kick ${pname}`);
    });

    socket.on('count-possibilities', (cards, lname) => {
        sendPossibleCards(socket, cards, lname);
    });

    socket.on('new-card-on-top', (lname, uname, card, prevCard) => {
        moveCommited(lname, uname, card, prevCard);
    });

    socket.on('move-without-new-card', (lname, uname) => {
        moveWithoutNewCard(lname, uname);
    });

    socket.on('draw-request', (lname)=>{
        drawByChoice(socket, lname);
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

const setTopCardOfGame = (lname, card) => {
    gamesWithTopCard.set(lname, card);
}

const setPlayersTurn = (lname, uname) => {
    gamesWithPlayersTurn.set(lname, uname);
}

const kickFromLobby = (pname,lname) => {
    io.to(lname).emit('kick-player-from-lobby', pname);
}

const initiateGameMoves = (lname) => {
    gamesWithMoves.set(lname, 0);
}

const addOneMoveToGame = (lname) => {
    let addition = gamesWithMoves.get(lname) + 1;
    gamesWithMoves.set(lname, addition);
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
        changeDeckOfTheGame(lname, deckArr.join(','));
        counter++;
    }

    io.to(lname).emit('deck-sent', deckArr.join(','));
    console.log('deck sent to lobby'); 

    sendTopCardToLobby(lname);
    sendFirstMoveRequest(lname, usersNicks[1]);
    setPlayersTurn(lname, usersNicks[1]);
}

const sendTopCardToLobby = (lname) =>{
    let deck = gamesWithDecks.get(lname).split(',');
    let card = deck.pop();

    let newDeck = arrayRemove(deck, card);
    changeDeckOfTheGame(lname, newDeck.join(','));
    io.to(lname).emit('top-card', card);
    setTopCardOfGame(lname, card);
}

const sendFirstMoveRequest = (lname, uname) => {
    io.to(lname).emit('first-move', uname);

    initiateGameMoves(lname);
}

const sendPossibleCards = (socket, cards, lname) => {
    let tcard = gamesWithTopCard.get(lname);
    let cardsSplitted = cards.split(',');
    let topCardColour = getCardColour(tcard);
    let topCardFigure = getCardFigure(tcard);
    let deck = gamesWithDecks.get(lname);
    let deckAsArray = deck.split(',');
    let possibleCards = [];
    let moveIndex = gamesWithMoves.get(lname);

    for(const card of cardsSplitted){
        let currentCardColour = getCardColour(card);
        let currentCardFigure = getCardFigure(card);

        if(moveIndex == 0){
            if((currentCardColour == topCardColour) || (currentCardFigure == topCardFigure)){
                possibleCards.push(card);
            }
        }else{
            if(topCardFigure=="dama"){
                possibleCards.push(card);
                continue;
            }
            if(!isSpecialCard(tcard) && currentCardFigure=="dama"){
                possibleCards.push(card);
                continue;
            }
            if((currentCardColour == topCardColour) && !isSpecialCard(tcard)){
                possibleCards.push(card);
                continue;
            }
            if((currentCardFigure == topCardFigure) && !isSpecialCard(tcard)){
                possibleCards.push(card);
                continue;
            }
            if((currentCardFigure == topCardFigure) && isSpecialCard(tcard)){
                possibleCards.push(card);
                continue;
            }
        }
    }

    if(possibleCards.length == 0){
        let cardToPull = pullOneCardAndChangeDeck(deckAsArray, lname);
        socket.emit('pull-card', cardToPull);
    }

    socket.emit('possible-cards', possibleCards.join(','));
}

const moveCommited = (lname, uname, card, prevCard) => {
    addOneMoveToGame(lname);
    setTopCardOfGame(lname, card);
    console.log(lname+ " : " +card);

    let deck = gamesWithDecks.get(lname);
    let deckArr = deck.split(',');
    deckArr.unshift(prevCard);
    changeDeckOfTheGame(lname, deckArr.join(','));

    let players = lobbysWithUsers.get(lname);
    let index = players.indexOf(uname);

    if(index == players.length - 1){
        io.to(lname).emit('new-move', players[0]);

        setPlayersTurn(lname, players[0]);
        console.log(gamesWithPlayersTurn);
    }
    else{
        index += 1;
        io.to(lname).emit('new-move', players[index]);

        setPlayersTurn(lname, players[index]);
        console.log(gamesWithPlayersTurn);
    }

    io.to(lname).emit('change-top-card', uname, card);
};

const moveWithoutNewCard = (lname, uname) => {
    addOneMoveToGame(lname);
    let players = lobbysWithUsers.get(lname);
    let index = players.indexOf(uname);

    if(index == players.length - 1){
        io.to(lname).emit('new-move', players[0]);

        setPlayersTurn(lname, players[0]);
    }
    else{
        index += 1;
        io.to(lname).emit('new-move', players[index]);

        setPlayersTurn(lname, players[index]);
    }
}

const drawByChoice = (socket, lname) => {
    let deck = gamesWithDecks.get(lname);
    let deckArray = deck.split(',');

    let card = pullOneCardAndChangeDeck(deckArray, lname);
    socket.emit('pull-card', card);
};

const pullOneCardAndChangeDeck = (deckArray, lname) => {
    let card = deckArray.pop();
    changeDeckOfTheGame(lname, deckArray.join(','));
    return card;
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

const getCardColour = (card) =>{
    if(card.includes('pik')) return 'pik';
    if(card.includes('trefl')) return 'trefl';
    if(card.includes('karo')) return 'karo';
    if(card.includes('kier')) return 'kier';
}

const getCardFigure = (card) => {
    let colour = getCardColour(card);

    return card.replace(colour, '');
}

const isSpecialCard = (card) => {
    let colour = getCardColour(card);
    let figure = getCardFigure(card);

    if(figure == '2' || figure == '3' || figure == '4' || figure == 'jopek' || figure == 'as'){
        return true;
    }
    if(figure == 'krol' && (colour == 'pik' || colour == 'kier')){
        return true;
    }

    return false;
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