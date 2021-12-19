const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const favicon = require('serve-favicon');

app.use(favicon(__dirname+'/public/graphics/favicon.ico'));
app.use(express.static(__dirname+'/public'));

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,'/public/views/index.html'))
});

app.listen(port, () => {
    console.log("Listening on port "+port);
});