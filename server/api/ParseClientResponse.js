"use strict";

/**
 * @param {Buffer} data 
 */
function parseClientResponse(data) {
    let result = {
        size: data.readInt32LE(0),
        id: data.readInt32LE(4),
        type: data.readInt32LE(8),
        body: data.toString("ascii", 12, data.length - 2)
    }

    return result;
}

module.exports = {parseClientResponse};