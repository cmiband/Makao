const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const yourNick = document.getElementById('yourNick');
const usersInLobby = document.getElementById('usersInLobby');
const leaveButton = document.getElementById('leaveButton');
const rootElement = document.getElementById('root');

let gameBoard;
let boardCentreForCard;
let playerOnePlace;
let playerTwoPlace;
let playerThreePlace;
let playerFourPlace;
let topCardPlace;
let topCardName;
let deckCard;

let userName = sessionStorage.getItem('joiningname');
let partyOwnerName;
let lobbyName = sessionStorage.getItem('joininglobbyname');
if(userName == null || lobbyName == null){
    window.location = '/';
}
let users = [];
let deck;
let hand = [];
let possibleCards = [];

let move = false;
let blocked = false;
let turnsToWait = 0;

sessionStorage.clear();

leaveButton.addEventListener('click', leaveLobby);

socket.emit('user-joined-lobby', userName, lobbyName);

function leaveLobby(){
    window.location = '/';
}

function addPlayerToList(playerName){
    const div = document.createElement("div");
    div.classList.add('specificUserInLobby');
    div.id = playerName;
    div.textContent = playerName;
    div.id = playerName;
    usersInLobby.append(div);
}

function addToListIterating(arr){
    for(const name of arr){
        addPlayerToList(name);
        users.push(name);
    }
}

function removeFromArray(arr,value){
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}

function removePlayerFromList(playerName){
    const target = document.getElementById(playerName);
    target.remove();
    let temp = removeFromArray(users, playerName);
    users = temp;
}

function renderCards(cards){
    for(const card of cards){
        let fileName = card + ".png";
        let path = '/public/graphics/' + fileName;
        const img = document.createElement("img");
        img.src = path;
        img.id = card;
        img.draggable = true;
        img.ondragstart = drag;

        playerOnePlace.append(img);
        console.log('cards being rendered');
    }
}

function renderOtherPlayers(){
    for(let i = 0; i<users.length-1; i++){
        if(i%2==0){
            for(let j = 0; j<5; j++){
                let fileName = "rewers.png";
                let path = '/public/graphics/' + fileName;
                const card = document.createElement('img');
                card.src = path;
                card.id = "rewers"+j+","+i;
                card.className = "imgHorizontal";

                if(i==0){
                    playerTwoPlace.append(card);
                }
                if(i==2){
                    playerFourPlace.append(card);
                }
            }
        }
        else{
            for(let j = 0; j<5; j++){
                let fileName = "rewers.png";
                let path = '/public/graphics/' + fileName;
                const card = document.createElement('img');
                card.src = path;
                card.id = "rewers"+j+","+i;
                card.className = "imgVertical";

                playerThreePlace.append(card);
            }
        }
    }
}

function addVerticalCard(card, playerId){
    let fileName = card + ".png";
    let path = "/public/graphics/" + fileName;
    
    const img = document.createElement('img');
    img.src = path;
    img.id = card;
    img.draggable = true;
    img.ondragstart = drag;
    img.className = "imgVertical";

    if(playerId == 1){
        playerOnePlace.append(img);
    }
    if(playerId == 3){
        playerThreePlace.append(img);
    }
}

function addHorizontalCard(card, playerId){
    let fileName = card + ".png";
    let path = "/public/graphics/" + fileName;
    
    const img = document.createElement('img');
    img.src = path;
    img.id = card;
    img.draggable = true;
    img.ondragstart = drag;
    img.className = "imgHorizontal";

    if(playerId == 2){
        playerOnePlace.append(img);
    }
    if(playerId == 4){
        playerThreePlace.append(img);
    }
}

function newCardOnTop(newCard){
    const prevTopCard = boardCentreForCard.firstChild;
    prevTopCard.remove();
    
    const card = document.createElement('img');
    card.id = 'topCard';
    card.src = '/public/graphics/' + newCard + '.png';
    card.className = 'imgVertical';
    boardCentreForCard.append(card);
}

function allowDrop(ev) {
    ev.preventDefault();
}
  
function drag(ev) {
    if(move){
        ev.dataTransfer.setData("text", ev.target.id);
    }
}
  
function drop(ev) {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    console.log(data);
    if(possibleCards.includes(data)){   
        newCardOnTop(data);

        const oldCardToRemove = document.getElementById(data);
        oldCardToRemove.remove();

        socket.emit('new-card-on-top', lobbyName, userName, data, topCardName);
        move = false;
        topCardName = data;
        
        let removalIndex = hand.indexOf(data);
        hand.splice(removalIndex, 1);
    }
}

function drawCard(){
    if(move){
        socket.emit('draw-request', lobbyName);
    }
}

socket.on('user-info-receiver', (owname, usersIn) => {
    partyOwnerName = owname;

    addToListIterating(usersIn);

    title.textContent = `${lobbyName}, lobby gracza ${partyOwnerName}`;
    yourNick.textContent = `Twój nick: ${userName}`;
    socket.emit('add-to-list-attempt', userName, lobbyName);
});

socket.on('add-to-list', (uname) => {
    if(!users.includes(uname)){
        addPlayerToList(uname);
        users.push(uname);
    }
});

socket.on('owner-left-kick-all', () => {
    leaveLobby();
})

socket.on('remove-user-from-list', (uname) => {
    removePlayerFromList(uname);
});

socket.on('load-game-for-lobby', ()=>{
    rootElement.remove();
    document.title = "Makao i po makale";

    const tempBoard = document.createElement('div');
    tempBoard.id = 'gameBoard';

    document.body.append(tempBoard);
    gameBoard = document.getElementById('gameBoard');

    const playerOne = document.createElement("div");
    playerOne.id = 'player1';
    playerOnePlace = playerOne;
    gameBoard.append(playerOne);

    const playerTwo = document.createElement("div");
    playerTwo.id = 'player2';
    playerTwoPlace = playerTwo;
    gameBoard.append(playerTwo);

    const playerThree = document.createElement("div");
    playerThree.id = 'player3';
    playerThreePlace = playerThree;
    gameBoard.append(playerThree);

    const playerFour = document.createElement("div");
    playerFour.id = 'player4';
    playerFourPlace = playerFour;

    const drawButton = document.createElement('button');
    drawButton.textContent = "DOBIERZ";
    drawButton.id = "drawButton";
    drawButton.addEventListener('click', drawCard);
    gameBoard.append(drawButton);

    const labelForDemandedCard = document.createElement('label');
    labelForDemandedCard.className = "demandedCard";
    labelForDemandedCard.htmlFor = "demandedCards";
    labelForDemandedCard.textContent = "Wybierz kartę: ";
    gameBoard.append(labelForDemandedCard);

    const selectDemandedCard = document.createElement('select');
    selectDemandedCard.className = "demandedCard";
    selectDemandedCard.name = "demandedCards";
    gameBoard.append(selectDemandedCard);

    for(let i = 2; i<=10; i++){
        const option = document.createElement('option');
        option.value = ""+i;
        option.textContent = ""+i;
        selectDemandedCard.append(option);
    }

    const submit = document.createElement('button');
    submit.id = "submitChoice";
    submit.className = "demandedCard";
    submit.textContent = "WYBIERZ";
    gameBoard.append(submit);

    gameBoard.append(playerFour);
});

socket.on('deck-sent', (deckSent)=>{
    deck = deckSent;
});

socket.on('hand-sent', (handSent)=>{
    hand = handSent;
    renderCards(hand);
    renderOtherPlayers();
    console.log('deck received');
});

socket.on('kick-player-from-lobby', (pname)=>{
    console.log('received on user side');
    if(pname==userName){
        leaveLobby();
    }
});

socket.on('top-card', (card)=>{
    topCardName = card;

    const boardCentre = document.createElement('div');
    boardCentre.id = 'boardCentre';
    boardCentre.ondrop = drop;
    boardCentre.ondragover = allowDrop;
    boardCentreForCard = boardCentre;
    gameBoard.append(boardCentre);

    const topCard = document.createElement('img');
    topCard.id = 'topCard';
    topCard.src = '/public/graphics/' + card + '.png';
    topCard.className = "imgVertical";
    topCardPlace = topCard;
    boardCentre.append(topCard);

    const dCard = document.createElement('img');
    dCard.id = 'deckTopCard';
    dCard.src = '/public/graphics/rewers.png';
    dCard.className = "imgVertical";
    deckCard = dCard;
    gameBoard.append(dCard);
});

socket.on('first-move', (uname) => {
    if(uname == userName){
        alert("it's my move");
        move = true;

        socket.emit('count-possibilities', hand, lobbyName);
    }
});

socket.on('possible-cards', (cards)=>{
    possibleCards = cards;

    console.log(possibleCards);
});

socket.on('new-move', (userMoving) => {
    if(userName == userMoving){
        if(!blocked){
            possibleCards = [];

            move = true;
            alert('its my move!');
            console.log(topCardName);
            socket.emit('count-possibilities', hand, lobbyName, userName);
        }
        else{
            socket.emit('move-without-new-card', lobbyName, userName);
            turnsToWait--;
            if(turnsToWait==0) {
                blocked = false;
            }
        }
    }
});

socket.on('change-top-card', (uname, card) => {
    if(userName != uname){
        newCardOnTop(card);
        topCardName = card;
    }
});

socket.on('pull-card', (card) => {
    let tempHand = hand;
    tempHand.push(card);
    hand = tempHand;
    addVerticalCard(card, 1);
    socket.emit('move-without-new-card', lobbyName, userName);
    move = false;
});

socket.on('special-pull', (cards)=>{
    let tempHand = hand;
    for(const card of cards){
        tempHand.push(card);
        addVerticalCard(card, 1);
    }
    hand = tempHand;
    socket.emit('move-without-new-card', lobbyName, userName);
    move = false;
});

socket.on('im-blocked', (turns)=>{
    if(turns>1){
        blocked = true;
        turnsToWait = turns;
    }
    socket.emit('move-without-new-card', lobbyName, userName);
});