> # 🖥 RCON Server
> RCON Server for nodejs

## ⬇ Installation

```diff
$ npm install rcon-server
```

## ℹ Basic Usage Example

```js

const {RCONServer} = require("rcon-server");

process.title = "RCON Server";

const server = new RCONServer({
    port: 2090, 
    host: "127.0.0.1",
    password: "password"
});

server.on("listening",({port, host})=>{
    console.log("Listening..", `${host}:${port}`);
});
server.connect();

server.on("commandRequest", (cmd)=>{
    console.log("commandRequest", cmd);
    console.log("New Command Request:", cmd.body);
    d.resolve("Echo: "+d.body);
})

server.on("login", ({password, successful})=>{
    if (successful) {
        console.log("Client successfully logged in! With password:", password);
    } else {
        console.log("Client login error! With password:", password);
    }
})

```

---

> ### Created by Kıraç Armağan Önal