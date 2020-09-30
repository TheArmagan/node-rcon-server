const net = require("net");

"use strict"

class SocketWriter {

    /** @type {net.Socket} */
    #socket

    /** @param {net.Socket} socket */
    constructor(socket) {
        this.#socket = socket;
    }

    /**
     * @param {{type: number, id?: number, body:buffer|string}} data 
     * @returns {Number} id of the packet
     */
    socketWrite(data) {

        if (typeof data.body == "undefined") data.body = String.fromCharCode(0);
        if (typeof data.id == "undefined") data.id = ++global.idIndex;

        let bufSize = data.body.length + 14;

        /** @type {Buffer} */
        let buffer = new Buffer.alloc(bufSize);

        buffer.writeInt32LE(bufSize - 4, 0);

        buffer.writeInt32LE(data.id, 4);
        
        buffer.writeInt32LE(data.type, 8);
        
        buffer.write(data.body, 12, bufSize - 2, "ascii");

        buffer.writeInt16LE(0, bufSize - 2);

        this.#socket.write(buffer);

        return data.id
    }

}

module.exports = SocketWriter;