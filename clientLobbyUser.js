const socket = io('http://localhost:3000');

const title = document.getElementById('title');

let userName;
let partyOwnerName;
let lobbyName;

socket.emit('user-joined-lobby');

socket.on('user-info-receiver', (nick) => {
    userName = nick;
});

