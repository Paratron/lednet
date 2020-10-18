const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const BROADCAST_ADDR = '230.185.192.178';

let instanceId = Math.floor(Math.random() * 7634872394723).toString(32);

let eventListeners = {};

const MODES = {
    SERVER: 0,
    CLIENT: 1
};

let internalSpecCollector = () => ({});
let discoveryCollector;

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
    const json = JSON.parse(msg.toString());

    if (!json || !json.type) {
        console.log("Dropped invalid message");
        return;
    }

    if (json.meta && json.meta.instanceId && json.meta.instanceId !== instanceId) {
        return;
    }

    if (module.exports.logMessages) {
        console.log("<<R<<", msg.toString());
    }

    if (discoveryCollector && json.type === "specs") {
        discoveryCollector.push(Object.assign({}, rinfo, {spec: json.data}));
        return;
    }

    if (netMode === MODES.CLIENT && json.type === "hi") {
        module.exports.send("specs", internalSpecCollector(), {instanceId});
        return;
    }

    trigger(json.type, json.data, json.meta, rinfo);
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
     * @param {*} [meta] Additional data to the request.
     * @param {string} [target] IP address. Omit to broadcast.
     */
    send: (type, data, meta) => {
        if (netMode === MODES.CLIENT && !target) {
            target = serverAddress;
        }

        if (module.exports.logMessages) {
            console.log(">>S>>", {type, data});
        }

        socket.send(
            JSON.stringify({
                type,
                data,
                meta
            }),
            remotePort,
            BROADCAST_ADDR
        );
    },

    discoverClients: (timeoutMS = 500) => new Promise((resolve, reject) => {
        discoveryCollector = [];
        setTimeout(() => {
            if (discoveryCollector.length > 0) {
                resolve(discoveryCollector);
                discoveryCollector = undefined;
                return;
            }
            reject();
        }, timeoutMS);
        module.exports.send("hi");
    }),

    /**
     * Will start the network adapter and bind it to the given port.
     * @param {number} mode Use either CLIENT or SERVER from this module.
     */
    start: (mode, specCollector) => {
        netMode = mode;

        if (mode === MODES.SERVER) {
            ownPort = 62882;
            remotePort = 41234;
        } else {
            ownPort = 41234;
            remotePort = 62882;
            if (specCollector) {
                internalSpecCollector = specCollector;
            }
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
