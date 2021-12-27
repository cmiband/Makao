const socket = io('http://localhost:3000');

const title = document.getElementById('title');
const yourNick = document.getElementById('yourNick');

let userName;
let partyOwnerName;
let lobbyName;

socket.emit('user-joined-lobby');

socket.on('user-info-receiver', (nick,lname,owname) => {
    userName = nick;
    partyOwnerName = owname;
    lobbyName=lname;

    alert(userName + " " +partyOwnerName+ " " +lobbyName);

    title.innerHTML = `${lobbyName}, lobby gracza ${partyOwnerName}`;
    yourNick.innerHTML = `Twój nick: ${userName}`;
    socket.emit('add-to-list-attempt', userName, lobbyName);
});

socket.on('room-test', () => {
    alert('room works');
});

