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

    /** @type {number} */
    #clientLimit

    /** @type {boolean} */
    #destroySocketOnLimitExceeded

    /** @type {boolean} */
    #emitAdvancedEvents

    /** @type {Set<net.Socket>} */
    #connectedSockets = new Set()

    constructor({ 
        port = 3839, 
        host = "127.0.0.1", 
        password = "password", 
        clientLimit = 1, 
        destroySocketOnLimitExceeded = true, 
        emitAdvancedEvents = false
    }) {
        super();
        this.#port = port;
        this.#host = host;
        this.#password = password;
        this.#clientLimit = clientLimit;
        this.#destroySocketOnLimitExceeded = destroySocketOnLimitExceeded;
        this.#emitAdvancedEvents = emitAdvancedEvents;
    }

    connect() {

        this.#server = net.createServer((socket) => {

            if (this.#emitAdvancedEvents) this.emit("beforeSocketConnection", {socket});

            if (this.#connectedSockets.size >= this.#clientLimit) {
                if (this.#emitAdvancedEvents) this.emit("socketConnectionError", {socket, error: "connectionLimitExceeded"});
                if (!socket.destroyed) {
                    socket.end("connectionLimitExceeded")
                    if (this.#destroySocketOnLimitExceeded) socket.destroy();
                }
                return;
            }

            const sw = new SocketWriter(socket);

            if (this.#emitAdvancedEvents) this.emit("socketConnected", {socket});

            socket.on("data", (rawData) => {
                const data = parseRawRequestData(rawData);
                if (this.#emitAdvancedEvents) this.emit("socketData", {rawData, data})

                if (data.type == CLIENT_AUTH_REQUEST) {
                    if (data.body == this.#password) {
                        if (this.#emitAdvancedEvents) this.emit("beforeLogin", {socket, id: data.id, password: data.body})
                        sw.socketWrite({
                            id: data.id,
                            type: CLIENT_AUTH_SUCCESS
                        })
                        this.#connectedSockets.add(socket);
                        this.emit("login", {socket, id: data.id, password: data.body, successful: true})

                    } else {
                        sw.socketWrite({
                            id: data.id,
                            type: CLIENT_AUTH_ERROR
                        })
                        this.emit("login", {socket, id: data.id, password: data.body, successful: false})
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
                if (this.#emitAdvancedEvents) this.emit("socketError", {socket})
            });
            socket.on("end", () => {
                if (this.#emitAdvancedEvents) this.emit("socketEnd", {socket, end: true})
            });
            socket.on("close", (hadError) => {
                if (this.#emitAdvancedEvents) this.emit("socketClose", {socket, hadError})
                this.#connectedSockets.delete(socket);
            });
        })

        this.#server.listen(this.#port, this.#host, () => {
            this.emit("listening", this.getServerSettings());
        })

        this.#server.on("error", (error)=>{
            if (this.#emitAdvancedEvents) this.emit("serverError", {error})
        })
    }

    /** @returns {Set<net.Socket>} if its set this is means socket connected */
    getConnectedSockets() {
        return this.#connectedSockets;
    }

    /** @returns {net.Server} */
    getSocketServer() {
        return this.#server;
    }

    getServerSettings() {
        return { 
            port: this.#port, 
            host: this.#host, 
            password: this.#password, 
            clientLimit: this.#clientLimit, 
            destroySocketOnLimitExceeded: this.#destroySocketOnLimitExceeded,
            emitAdvancedEvents: this.#emitAdvancedEvents
        }
    }

}

module.exports = { RCONServer }

