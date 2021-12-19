const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const favicon = require('serve-favicon');

app.use(favicon(__dirname+'/graphics/favicon.ico'));

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname+'/views/index.html'))
});

app.listen(port, () => {
    console.log("Listening on port "+port);
});