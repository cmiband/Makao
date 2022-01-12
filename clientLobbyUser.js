const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const yourNick = document.getElementById('yourNick');
const usersInLobby = document.getElementById('usersInLobby');
const leaveButton = document.getElementById('leaveButton');

let userName;
let partyOwnerName;
let lobbyName;
let users = [];

leaveButton.addEventListener('click', leaveLobby);

socket.emit('user-joined-lobby');

function leaveLobby(){
    document.location.href = '/public/views/index.html';
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

socket.on('user-info-receiver', (nick,lname,owname, usersIn) => {
    userName = nick;
    partyOwnerName = owname;
    lobbyName=lname;

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