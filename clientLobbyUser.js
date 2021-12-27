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
    usersInLobby.append(div);
}

socket.on('user-info-receiver', (nick,lname,owname) => {
    userName = nick;
    partyOwnerName = owname;
    lobbyName=lname;

    alert(userName + " " +partyOwnerName+ " " +lobbyName);

    addPlayerToList(partyOwnerName);
    users.push(partyOwnerName);

    addPlayerToList(userName);
    users.push(userName);

    title.innerHTML = `${lobbyName}, lobby gracza ${partyOwnerName}`;
    yourNick.innerHTML = `Twój nick: ${userName}`;
    socket.emit('add-to-list-attempt', userName, lobbyName);
});

socket.on('add-to-list', (uname) => {
    if(!users.has(uname)){
        addPlayerToList(uname);
        users.push(uname);
    }
    alert('room works');
});

socket.on('owner-left-kick-all', () => {
    leaveLobby();
})
