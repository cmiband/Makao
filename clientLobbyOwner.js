const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const leaveButton = document.getElementById('leaveButton');
const usersInLobby = document.getElementById('usersInLobby');
const yourNick = document.getElementById('yourNick');

let userName;
let lobbyName;
let users = [];

leaveButton.addEventListener('click', leaveLobby);

socket.emit('lobbyPageLoaded');

function leaveLobby(){
    socket.emit('owner-leaves', lobbyName);
    document.location.href = '/public/views/index.html';
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