const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const yourNick = document.getElementById('yourNick');
const usersInLobby = document.getElementById('usersInLobby');
const leaveButton = document.getElementById('leaveButton');
const rootElement = document.getElementById('root');

let gameBoard;
let playerOnePlace;

let userName = sessionStorage.getItem('joiningname');
let partyOwnerName;
let lobbyName = sessionStorage.getItem('joininglobbyname');
let users = [];
let deck;
let hand;

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
});

socket.on('deck-sent', (deckSent)=>{
    deck = deckSent;
});

socket.on('hand-sent', (handSent)=>{
    hand = handSent;
});