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

    title.textContent = `${lobbyName}, lobby gracza ${partyOwnerName}`;
    yourNick.textContent = `Twój nick: ${userName}`;
    socket.emit('add-to-list-attempt', userName, lobbyName);
});

socket.on('add-to-list', (uname) => {
    alert('request received with username : ' +uname);
    if(!users.includes(uname)){
        addPlayerToList(uname);
        users.push(uname);
    }
});

socket.on('owner-left-kick-all', () => {
    leaveLobby();
})
