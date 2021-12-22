const socket = io('http://localhost:3000');

const createLobbyButton = document.getElementById('createLobbyButton');
const joinLobbyButton = document.getElementById('joinLobbyButton');

createLobbyButton.addEventListener('click', createLobby);
joinLobbyButton.addEventListener('click', joinLobby);

async function joinLobby(){
    let uname = document.getElementById('nickForJoining').value;
    let lname = document.getElementById('lobbyForJoining').value;

    await socket.emit('join-lobby-attempt', uname, lname);
}

socket.on('lobby-found', () => {
    document.location.href = '/public/views/lobbyUserSide.html';
})

async function createLobby(){
    let uname = document.getElementById('nickForCreation').value;
    let lname = document.getElementById('lobbyForCreation').value;

    await socket.emit('create-lobby', uname,lname);
    
    document.location.href = '/public/views/lobby.html';
}
