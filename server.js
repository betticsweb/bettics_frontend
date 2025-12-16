const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(__dirname + '/dist/front-solbet'));
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname +
        '/dist/front-solbet/index.html'));
});
app.listen((8080), () => {
    console.log('process.env.PORT');
    console.log(process.env.PORT);
    console.log('Servidor corriendo en puerto');
});