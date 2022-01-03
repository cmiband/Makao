const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const leaveButton = document.getElementById('leaveButton');
const usersInLobby = document.getElementById('usersInLobby');

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
    usersInLobby.append(div);
}

socket.on('sendInformationToLobby', (uname,lname) => {
    userName = uname;
    lobbyName = lname;
    title.innerHTML = `${lobbyName}, lobby gracza ${userName}`;

    addPlayerToList(uname);
    users.push(uname);

    socket.emit('ownerJoinedLobby', uname,socket.id);
});

socket.on('add-to-list', (uname, usersTempArray) => {
    if(!users.includes(uname)){
        addPlayerToList(uname);
        users.push(uname);
    }
    let temp = usersTempArray;
    alert(temp[users.length-1]);
});