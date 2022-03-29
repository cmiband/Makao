const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const leaveButton = document.getElementById('leaveButton');
const startButton = document.getElementById('startButton');
const usersInLobby = document.getElementById('usersInLobby');
const yourNick = document.getElementById('yourNick');
const warn = document.getElementById('warn');
const rootElement = document.getElementById('root');
let kickButton;

let gameBoard;
let playerOnePlace;
let playerTwoPlace;
let playerThreePlace;
let playerFourPlace;
let topCardPlace;
let topCardName;

let userName = sessionStorage.getItem('username');
let lobbyName = sessionStorage.getItem('lobbyname');
let users = [];
let deck;
let hand;

let move = false;

sessionStorage.clear();

leaveButton.addEventListener('click', leaveLobby);
startButton.addEventListener('click', startGame);

socket.emit('lobbyPageLoaded', userName, socket.id);

title.innerHTML = `${lobbyName}, lobby gracza ${userName}`;

addPlayerToList(userName);
users.push(userName);

yourNick.textContent = "Twój nick: "+userName;

function leaveLobby(){
    socket.emit('owner-leaves', lobbyName);
    window.location = '/';
}

function startGame(){
    if(users.length <= 2){
        warn.textContent = 'Za mało graczy do zaczęcia gry!';
    }
    else if(users.length > 4){
        warn.textContent = 'Za dużo graczy do zaczęcia gry!';
    }
    else{
        socket.emit('owner-started-game', lobbyName);
    }
}

function addPlayerToList(playerName){
    const div = document.createElement("div");
    div.classList.add('specificUserInLobby');
    div.textContent =  playerName;
    div.id = playerName;
    usersInLobby.append(div);

    if(playerName!=userName){
        const kbutton = document.createElement("button");
        kbutton.classList.add('kickButton');
        kbutton.textContent = "KICK";
        kbutton.id = playerName+"KICK";
        kbutton.addEventListener('click', (e) => kickPlayer(playerName));
        document.getElementById(playerName).append(kbutton);
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
        img.className = 'imgVertical';

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

function kickPlayer(playerName){
    socket.emit('kick-player-request', lobbyName,playerName);
}

socket.on('add-to-list', (uname) => {
    if(!users.includes(uname)){
        addPlayerToList(uname);
        users.push(uname);
    }
});

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



    socket.emit('request-deck', lobbyName);
});

socket.on('deck-sent', (deckSent) => {
    deck = deckSent.split(',');
});

socket.on('hand-sent', (handSent)=>{
    hand = handSent;
    renderCards(hand.split(','));
    renderOtherPlayers();
    console.log('deck received');
});

socket.on('top-card', (card)=>{
    topCardName = card;

    const topCard = document.createElement('img');
    topCard.id = 'topCard';
    topCard.src = '/public/graphics/' + card +'.png';
    topCard.className = "imgVertical";
    topCardPlace = topCard;
    gameBoard.append(topCard);
})