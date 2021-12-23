const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const leaveButton = document.getElementById('leaveButton');
const usersInLobby = document.getElementById('usersInLobby');

let userName;
let lobbyName;

leaveButton.addEventListener('click', leaveLobby);

socket.emit('lobbyPageLoaded');

async function leaveLobby(){
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

    socket.emit('ownerJoinedLobby', uname,socket.id);
});
