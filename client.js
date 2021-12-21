const socket = io('http://localhost:3000');

const createLobbyButton = document.getElementById('createLobbyButton');
const application = document.getElementById('root');

createLobbyButton.addEventListener('click', createLobby);

async function createLobby(){
    let uname = document.getElementById('nickForCreation').value;
    let lname = document.getElementById('lobbyForCreation').value;

    await socket.emit('create-lobby', uname,lname);
    application.innerHTML = '<object type="text/html" data="/public/views/lobby.html" ></object>';
}
