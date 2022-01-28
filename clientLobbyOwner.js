const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const leaveButton = document.getElementById('leaveButton');
const startButton = document.getElementById('startButton');
const usersInLobby = document.getElementById('usersInLobby');
const yourNick = document.getElementById('yourNick');
const warn = document.getElementById('warn');
const rootElement = document.getElementById('root');

let gameBoard;

let userName;
let lobbyName;
let users = [];
let deck;

leaveButton.addEventListener('click', leaveLobby);
startButton.addEventListener('click', startGame);

socket.emit('lobbyPageLoaded');

function leaveLobby(){
    socket.emit('owner-leaves', lobbyName);
    document.location.href = '/index.html';
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

socket.on('sendInformationToLobby', (uname,lname) => {
    userName = uname;
    lobbyName = lname;
    title.innerHTML = `${lobbyName}, lobby gracza ${userName}`;

    addPlayerToList(uname);
    users.push(uname);

    yourNick.textContent = "Twój nick: "+userName;

    socket.emit('ownerJoinedLobby', uname,socket.id);
});

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

    socket.emit('request-deck', lobbyName);
});

socket.on('deck-sent', (deckSent) => {
    deck = deckSent.split(',');
    alert(deck);
});