const WebSocket = require('ws');

const WS_PORT = 40567;

let socketServer;
if (!socketServer) {
    socketServer = new WebSocket.Server({
        port: WS_PORT
    });

    socketServer.on('connection', function (client) {
        // client.send('hello client');
        console.log(`A client has connected successfully`);
        client.on('message', function (msg) {
            console.log(`received: ${msg}`);
        });
    });

    console.log(`WebSocket server is listening at port ${WS_PORT}`);
}

function broadcastAll(msg) {
    for (const client of socketServer.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

module.exports = {
    broadcastAll
};
