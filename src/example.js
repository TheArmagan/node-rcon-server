const {RCONServer} = require("./server");

process.title = "RCON Server";

const server = new RCONServer({
    port: 19132, 
    host: "127.0.0.1",
    password: "password"
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