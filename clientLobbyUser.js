const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const yourNick = document.getElementById('yourNick');
const usersInLobby = document.getElementById('usersInLobby');
const leaveButton = document.getElementById('leaveButton');
const rootElement = document.getElementById('root');

let gameBoard;
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
let users = [];
let deck;
let hand;

let move = false;

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
    gameBoard.append(playerFour);
});

socket.on('deck-sent', (deckSent)=>{
    deck = deckSent;
});

socket.on('hand-sent', (handSent)=>{
    hand = handSent;
    renderCards(hand.split(','));
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

    const topCard = document.createElement('img');
    topCard.id = 'topCard';
    topCard.src = '/public/graphics/' + card + '.png';
    topCard.className = "imgVertical";
    topCardPlace = topCard;
    gameBoard.append(topCard);

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

        socket.emit('count-possibilities', lobbyName, uname, deck, topCardName);
    }
});