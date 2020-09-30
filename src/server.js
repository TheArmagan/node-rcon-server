const { EventEmitter } = require("events");
const net = require("net");

const parseRawRequestData = require("./api/parseRawRequestData");
const {
    CLIENT_AUTH_REQUEST,
    CLIENT_AUTH_SUCCESS,
    CLIENT_AUTH_ERROR,
    CLIENT_COMMAND_REQUEST,
    CLIENT_COMMAND_RESPONSE
} = require("./api/RequestTypes");
const SocketWriter = require("./api/socketWriter");


global.idIndex = 0;


class RCONServer extends EventEmitter {

    /** @type {net.Server} */
    #server

    /** @type {string} */
    #port

    /** @type {string} */
    #host

    /** @type {string} */
    #password

    /** @type {net.Socket|null} if its set this is means socket connected */
    #connectedSocket = null

    constructor({ port = 19132, host = "127.0.0.1", password = "password" }) {
        super();
        this.#port = port;
        this.#host = host;
        this.#password = password;
    }

    connect() {
        this.#server = net.createServer((socket) => {

            this.emit("socketConnectTry", {socket});

            if (this.#connectedSocket != null) {
                this.emit("socketConnectError", {socket, error: "alreadyConnected"});
                return;
            }

            const sw = new SocketWriter(socket);

            this.emit("socketConnected", {socket});

            socket.on("data", (rawData) => {
                const data = parseRawRequestData(rawData);
                this.emit("socketData", {rawData, data})

                if (data.type == CLIENT_AUTH_REQUEST) {
                    if (data.body == this.#password) {
                        sw.socketWrite({
                            id: data.id,
                            type: CLIENT_AUTH_SUCCESS
                        })
                        this.#connectedSocket = socket;
                        this.emit("login", {id: data.id, password: data.body, successful: true})
                    } else {
                        sw.socketWrite({
                            id: data.id,
                            type: CLIENT_AUTH_ERROR
                        })
                        this.emit("login", {id: data.id, password: data.body, successful: false})
                    }
                } else if (data.type == CLIENT_COMMAND_REQUEST) {
                    let resData = {...data};
                    resData.resolve = (msg)=>{
                        sw.socketWrite({
                            id: data.id,
                            type: CLIENT_COMMAND_RESPONSE,
                            body: msg
                        })
                    }

                    this.emit("commandRequest", resData);
                }
            })

            socket.on("error", () => {
                this.emit("socketError", {socket})
            });
            socket.on("end", () => {
                this.emit("socketEnd", {socket, end: true})
            });
            socket.on("close", (hadError) => {
                this.emit("socketClose", {socket, hadError})
                this.#connectedSocket = null;
            });
        })

        this.#server.listen(this.#port, this.#host, () => {
            this.emit("listening", this.getServerInfo());
        })

        this.#server.on("error", (error)=>{
            this.emit("serverError", {error})
        })
    }

    /** @returns {net.Socket|null} if its set this is means socket connected */
    getConnectedSocket() {
        return this.#connectedSocket;
    }

    /** @returns {net.Server} */
    getSocketServer() {
        return this.#server;
    }

    getServerInfo() {
        return { port: this.#port, host: this.#host, password: this.#password }
    }

}

module.exports = { RCONServer }

