const socket = io('http://localhost:3000');

const createLobbyButton = document.getElementById('createLobbyButton');
const joinLobbyButton = document.getElementById('joinLobbyButton');

createLobbyButton.addEventListener('click', createLobby);

async function joinLobby(){
    let uname = document.getElementById('nickForJoining');
    let lname = document.getElementById('lobbyForJoining');

    await socket.emit('join-lobby', uname, lname);

    document.location.href = '/public/views/lobby.html';
}

async function createLobby(){
    let uname = document.getElementById('nickForCreation').value;
    let lname = document.getElementById('lobbyForCreation').value;

    await socket.emit('create-lobby', uname,lname);
    
    document.location.href = '/public/views/lobby.html';
}
