const socket = io('http://localhost:3000');

const createLobbyButton = document.getElementById('createLobbyButton');

createLobbyButton.addEventListener('click', createLobby);

async function createLobby(){
    let uname = document.getElementById('nickForCreation').value;
    let lname = document.getElementById('lobbyForCreation').value;

    await socket.emit('create-lobby', uname,lname);
    
    document.location.href = '/public/views/lobby.html';
}
