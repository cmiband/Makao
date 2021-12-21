const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = 3000;
const path = require('path');
const io = require('socket.io')(server);
const favicon = require('serve-favicon');

app.use(favicon(__dirname+'/public/graphics/favicon.ico'));
app.use(express.static(__dirname));

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'))
});

server.listen(port, () => {
    console.log("Listening on port "+port);
});

io.on('connection', socket => {
    console.log(socket.id)

    socket.on('create-lobby', (uname, lname) => {
        console.log(uname + ' ' +lname)
    });
});