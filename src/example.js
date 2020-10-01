const {RCONServer} = require("./server");

process.title = "RCON Server";

const server = new RCONServer({
    port: 3839, // default to 3839
    host: "127.0.0.1", // default to 127.0.0.1
    password: "password", // default to password
    clientLimit: 1, // default to 1
    destroySocketOnLimitExceeded: true, // default to true
    emitAdvancedEvents: false // default to false
});

server.connect();

server.on("commandRequest", (d)=>{
    console.log("commandRequest", d);
    console.log("New Command Request:", d.body);
    d.resolve("Echo: "+d.body);
})

server.on("listening",({port, host})=>{
    console.log("Listening..", `${host}:${port}`);
});

server.on("login", ({password, successful})=>{
    if (successful) {
        console.log("Client successfully logged in! With password:", password);
    } else {
        console.log("Client login error! With password:", password);
    }
})