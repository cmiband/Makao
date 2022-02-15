const socket = io('http://localhost:3000');

const createLobbyButton = document.getElementById('createLobbyButton');
const joinLobbyButton = document.getElementById('joinLobbyButton');
const warns = document.getElementById('warn');

createLobbyButton.addEventListener('click', createLobby);
joinLobbyButton.addEventListener('click', joinLobby);

function joinLobby(){
    let uname = document.getElementById('nickForJoining').value;
    let lname = document.getElementById('lobbyForJoining').value;

    if(uname === '' || lname === ''){
        return;
    }

    socket.emit('join-lobby-attempt', uname, lname);
    sessionStorage.setItem('joiningname', uname);
    sessionStorage.setItem('joininglobbyname', lname);
}

function createLobby(){
    let uname = document.getElementById('nickForCreation').value;
    let lname = document.getElementById('lobbyForCreation').value;

    if(uname === '' || lname === ''){
        return;
    }

    socket.emit('create-lobby', uname,lname);
    sessionStorage.setItem('username', uname);
    sessionStorage.setItem('lobbyname', lname);
}

socket.on('username-taken', ()=>{
    warns.textContent = "Ten nick jest już zajęty!";
});

socket.on('lobby-not-existing', ()=>{
    warns.textContent = "Lobby o danej nazwie nie instnieje!";
});

socket.on('lobby-error', () => {
    warns.textContent = "Nie można stworzyć lobby o podanych danych!";
});

socket.on('load-lobby-owner-page', ()=>{
    window.location = '/lobbyowner';
});

socket.on('lobby-found', () => {
    window.location = '/lobby';
});