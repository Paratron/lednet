const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const BROADCAST_ADDR = '230.185.192.178';

let eventListeners = {};

const MODES = {
    SERVER: 0,
    CLIENT: 0
};

let netMode;
let ownPort;
let remotePort;
let serverAddress; // Only used in client mode.

/**
 * Trigger an event on all listeners.
 * @param {string} event
 * @param {*} [data] Optional data payload
 * @param {*} [meta] Optional metadata
 * @param {object} rinfo Remote network info (address, port, etc)
 */
const trigger = (event, data, meta, rinfo) => {
    if (!eventListeners[event]) {
        return;
    }

    eventListeners[event].forEach(cb => cb({data, meta, rinfo}));
};

socket.on('message', (msg, rinfo) => {
    if (netMode === MODES.CLIENT && !serverAddress) {
        serverAddress = rinfo.address;
        trigger('ready', null, null, rinfo);
    }

    const json = JSON.parse(msg.toString());
    trigger(json.type, json.data, json.meta, rinfo);

    if (module.exports.logMessages) {
        console.log(msg.toString());
    }
});

module.exports = {
    SERVER: MODES.SERVER,
    CLIENT: MODES.CLIENT,

    /**
     * Set this to true to write all incoming UDP messages to stdout.
     */
    logMessages: false,

    /**
     * Will create an UDP message and send it to the network.
     * Either specify a target, or omit to send a broadcast to all devices.
     *
     * @param {string} type Required message type.
     * @param {*} [data] Optional data payload for the message.
     * @param {string} [target] IP address. Omit to broadcast.
     */
    send: (type, data, target) => {
        if (netMode === MODES.CLIENT && !target) {
            target = serverAddress;
        }

        socket.send(
            JSON.stringify({
                type,
                data
            }),
            remotePort,
            target ? target : BROADCAST_ADDR
        );
    },

    /**
     * Will start the network adapter and bind it to the given port.
     * @param {number} mode Use either CLIENT or SERVER from this module.
     */
    start: (mode) => {
        netMode = mode;

        if (mode === MODES.SERVER) {
            ownPort = 62882;
            remotePort = 41234;
        } else {
            ownPort = 41234;
            remotePort = 62882;
        }

        socket.bind(ownPort, () => {
            socket.setBroadcast(true);
            socket.setMulticastTTL(128);
            socket.addMembership(BROADCAST_ADDR);
        });
    },

    on: (event, callback) => {
        eventListeners[event] = eventListeners[event] || [];
        eventListeners[event].push(callback);
    },

    off: (event, callback) => {
        if (!eventListeners[event]) {
            return;
        }
        const index = eventListeners[event].findIndex(callback);
        if (index !== -1) {
            eventListeners[event].splice(index, 1);
        }
    }
};