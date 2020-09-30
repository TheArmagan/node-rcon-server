const net = require("net");

const { parseClientResponse } = require("./api/ParseClientResponse");

const server = net.createServer((socket)=>{
    socket.on("data", (rawData)=>{
        const data = parseClientResponse(rawData);

        console.log(data);
    })
})

server.listen(19132, "127.0.0.1", ()=>{
    console.log("Listening..", 19132);
})