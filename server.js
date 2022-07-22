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
const gamesWithAmountOfCardsToPull = new Map();
const gamesWithCardsHistory = new Map();
const gamesWithTurnsToWait = new Map();
const gamesWithDemandedCards = new Map();

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

    socket.on('count-possibilities', (cards, lname, uname) => {
        sendPossibleCards(socket, cards, lname, uname);
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

    socket.on('cardGotSelected', (card, prevCard, uname, lname)=>{
        let figure = getCardFigure(card);
        demandACardInLobby(lname, figure);
        moveCommited(lname, uname, card, prevCard);
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

const setCardsToPull = (lname, amount) => {
    gamesWithAmountOfCardsToPull.set(lname, amount);
}

const setFirstCardInLobby = (lname, card) => {
    gamesWithCardsHistory.set(lname, [card]);
}

const addCardToHistory = (lname, card) => {
    gamesWithCardsHistory.get(lname).push(card);
}

const initiateBlockTurns = (lname) => {
    gamesWithTurnsToWait.set(lname, 0);
}

const addTurnToWait = (lname) => {
    let turnsToAdd = gamesWithTurnsToWait.get(lname) + 1;
    gamesWithTurnsToWait.set(lname, turnsToAdd);
}

const resetTurnsToWaitInLobby = (lname) => {
    gamesWithTurnsToWait.set(lname, 0);
}

const initiateDemandedCards = (lname) => {
    gamesWithDemandedCards.set(lname, '0');
}

const demandACardInLobby = (lname, cardFigure) =>{
    gamesWithDemandedCards.set(lname, cardFigure);
}

const resetDemandedCardInLobby = (lname) => {
    gamesWithDemandedCards.set(lname, '0');
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

    addDeckToGame(lname, shuffledDeck);
}

const sendHandToEachUser = (lname) => {
    let deck = gamesWithDecks.get(lname);
    let usersNicks = lobbysWithUsers.get(lname);
    let lobbySize = usersNicks.length;
    let counter = 0;

    for(const user of usersNicks){
        let userId = getKeyByValue(users, user);
        let cards = [];

        for(let i = 0; i<5; i++){
            let card = deck[i*lobbySize+counter];
            cards.push(card);
        }
        
        io.to(userId).emit('hand-sent', cards);
        deck = deleteCardsFromDeck(cards, lname);
        changeDeckOfTheGame(lname, deck);
        counter++;
    }

    io.to(lname).emit('deck-sent', deck);
    console.log('deck sent to lobby'); 

    sendTopCardToLobby(lname);
    sendFirstMoveRequest(lname, usersNicks[1]);
    setPlayersTurn(lname, usersNicks[1]);
}

const sendTopCardToLobby = (lname) =>{
    let deck = gamesWithDecks.get(lname);
    let card = deck.pop();

    let newDeck = arrayRemove(deck, card);
    changeDeckOfTheGame(lname, newDeck);
    io.to(lname).emit('top-card', card);
    setTopCardOfGame(lname, card);
    setFirstCardInLobby(lname, card);
}

const sendFirstMoveRequest = (lname, uname) => {
    io.to(lname).emit('first-move', uname);

    setCardsToPull(lname, 0);
    initiateBlockTurns(lname);
    initiateDemandedCards(lname);
}

const sendPossibleCards = (socket, cards, lname, uname) => {
    let tcard = gamesWithTopCard.get(lname);
    let topCardColour = getCardColour(tcard);
    let topCardFigure = getCardFigure(tcard);
    let deck = gamesWithDecks.get(lname);
    let possibleCards = [];
    let amountOfCardsToPull = gamesWithAmountOfCardsToPull.get(lname);
    let cardsHistory = gamesWithCardsHistory.get(lname);
    let turnsToWait = gamesWithTurnsToWait.get(lname);
    let demandedCard = gamesWithDemandedCards.get(lname);

    for(const card of cards){
        let currentCardColour = getCardColour(card);
        let currentCardFigure = getCardFigure(card);

        if(cardsHistory.length == 1){
            if((currentCardColour == topCardColour) || (currentCardFigure == topCardFigure)){
                possibleCards.push(card);
                continue;
            }
            if(topCardFigure=="dama" || currentCardFigure=="dama"){
                possibleCards.push(card);
                continue;
            }
        }else{
            if(amountOfCardsToPull==0){
                if(demandedCard=='0'){
                    if(topCardFigure=='4' && turnsToWait==0 && (topCardColour==currentCardColour)){
                        possibleCards.push(card);
                        continue;
                    }
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
                    if((currentCardColour==topCardColour) && isSpecialCard(tcard) && isCardGiving(tcard)){
                        possibleCards.push(card);
                        continue;
                    }
                    if(isCardGiving(tcard) && ((currentCardColour==topCardColour) || (currentCardFigure==topCardFigure))){
                        possibleCards.push(card);
                        continue;
                    }
                }
                else{
                    if(currentCardFigure==demandedCard){
                        possibleCards.push(card);
                        continue;
                    }
                    if((currentCardFigure=='jopek') && (currentCardColour==topCardColour)){
                        possibleCards.push(card);
                        continue;
                    }
                }
            }else{
                if(amountOfCardsToPull%2==0){
                    if(currentCardFigure=='2'){
                        possibleCards.push(card);
                        continue;
                    }
                }
                if(amountOfCardsToPull%3==0){
                    if(currentCardFigure=='3'){
                        possibleCards.push(card);
                        continue;
                    }
                }
                if(tcard=='krolkier'){
                    if(card=='krolpik'){
                        possibleCards.push(card);
                        continue;
                    }
                }
            }
        }
    }

    if(possibleCards.length == 0 && amountOfCardsToPull == 0 && turnsToWait == 0){
        let cardToPull = pullOneCardAndChangeDeck(deck, lname);
        socket.emit('pull-card', cardToPull);
    }else if(possibleCards.length == 0 && amountOfCardsToPull > 0 && turnsToWait == 0){
        let cardsToPull = takeCardsToPull(lname, amountOfCardsToPull);
        socket.emit('special-pull', cardsToPull);
        setCardsToPull(lname, 0);
    }else if(possibleCards.length == 0 && amountOfCardsToPull == 0 && turnsToWait>0){
        socket.emit("im-blocked", turnsToWait);
        resetTurnsToWaitInLobby(lname);

        console.log(uname+" is now blocked for "+turnsToWait);
    }

    socket.emit('possible-cards', possibleCards);
}

const moveCommited = (lname, uname, card, prevCard) => {
    setTopCardOfGame(lname, card);
    addCardToHistory(lname, card);
    console.log(lname+ " : " +card);
    let cardFigure = getCardFigure(card);

    if(isSpecialCard(card)){
        if(isCardGiving(card)){
            let amountToPull = gamesWithAmountOfCardsToPull.get(lname);
            if(cardFigure=='2'){
                amountToPull+=2;
            }
            if(cardFigure=='3'){
                amountToPull+=3;
            }
            if(card=="krolkier"){
                amountToPull+=5;
            }
            setCardsToPull(lname, amountToPull);
            console.log(`${lname} has ${amountToPull} cards to pull`);
        }
        if(cardFigure=='4'){
            addTurnToWait(lname);
            console.log("Turns to wait: "+gamesWithTurnsToWait.get(lname));
        }
    }

    let deck = gamesWithDecks.get(lname);
    deck.unshift(prevCard);
    changeDeckOfTheGame(lname, deck);

    let players = lobbysWithUsers.get(lname);
    let index = players.indexOf(uname);

    if(index == players.length - 1){
        index = 0;
    }
    else{
        index += 1; 
    }


    io.to(lname).emit('new-move', players[index]);
    setPlayersTurn(lname, players[index]);
    console.log(gamesWithPlayersTurn);
    io.to(lname).emit('change-top-card', uname, card);
};

const moveWithoutNewCard = (lname, uname) => {
    let players = lobbysWithUsers.get(lname);
    let index = players.indexOf(uname);

    if(index == players.length - 1){
        index = 0;
    }
    else{
        index += 1;
    }
    io.to(lname).emit('new-move', players[index]);
    setPlayersTurn(lname, players[index]);
}

const drawByChoice = (socket, lname) => {
    let deck = gamesWithDecks.get(lname);

    let card = pullOneCardAndChangeDeck(deck, lname);
    socket.emit('pull-card', card);
};

const pullOneCardAndChangeDeck = (deck, lname) => {
    let card = deck.pop();
    changeDeckOfTheGame(lname, deck);
    return card;
}

const takeCardsToPull = (lname, amount) =>{
    let deck = gamesWithDecks.get(lname);
    let cardsToPull = [];

    for(let i = 0; i<amount; i++){
        let card = deck.pop();
        cardsToPull.push(card);
    }

    changeDeckOfTheGame(lname, deck);
    return cardsToPull;
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

const isCardGiving = (card) => {
    let figure = getCardFigure(card);

    if((figure=='2') || (figure=='3') || (figure=='krolkier') || (figure=='krolpik')){
        return true;
    }

    return false;
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

    if(figure == '2' || figure == '3' || figure == '4' || figure == 'jopek' || figure == 'dama' || figure == 'as'){
        return true;
    }
    if(figure == 'krol' && (colour == 'pik' || colour == 'kier')){
        return true;
    }

    return false;
}

const deleteCardsFromDeck = (cards, lname) => {
    let deck = gamesWithDecks.get(lname);
    for(const card of cards){
        let temp = arrayRemove(deck, card);
        deck = temp;
    }

    return deck;
}