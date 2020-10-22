import { Socket } from "dgram"
import { v4 as uuid } from 'uuid';

export interface RemoteAddressInformation {
    address: string;
    family: "IPv4" | "IPv6";
    port: number;
    size: number;
}

export enum MODE {
    SERVER,
    CLIENT
}

let netMode: MODE;
let ownPort: number;
let remotePort: number;
const dgram = require('dgram');
const socket: Socket = dgram.createSocket('udp4');
const BROADCAST_ADDR = '230.185.192.178';

let clientId = Math.floor(Math.random() * 7634872394723).toString(32);

export type EventListenerFunction = (props: {data: any, meta: any, rinfo: RemoteAddressInformation}, response: (data: any) => void) => void;

interface EventListeners {
    [key: string]: EventListenerFunction[];
}

let eventListeners: EventListeners = {};
let responseWaiters: {[key: string]: (data: any) => void} = {};

interface Meta {
    clientId?: string;
    msgId: string;
}

export interface Client extends RemoteAddressInformation {
    spec: any;
    clientId: string;
}

let internalSpecCollector = () => ({});
let discoveryCollector: undefined | Client[];

/**
 * Trigger an event on all listeners.
 */
const trigger = (event: string, data: any, meta: Meta, rinfo: RemoteAddressInformation) => {
    if (!eventListeners[event]) {
        return;
    }

    const response = (responseData: any) => module.exports.send(event, responseData, {msgIdResponse: meta.msgId});

    eventListeners[event].forEach(cb => cb({data, meta, rinfo}, response));
};

socket.on('message', (msg: Buffer, rinfo: RemoteAddressInformation) => {
    const json = JSON.parse(msg.toString());

    if (!json || !json.type) {
        console.log("Dropped invalid message");
        return;
    }

    if (netMode === MODE.CLIENT && json.meta && json.meta.clientId && json.meta.clientId !== clientId) {
        return;
    }

    if (module.exports.logMessages) {
        console.log("<<R<<", msg.toString());
    }

    if (discoveryCollector && json.type === "specs") {
        discoveryCollector.push(Object.assign({}, rinfo, {spec: json.data, clientId: json.meta.clientId}));
        return;
    }

    if (netMode === MODE.CLIENT && json.type === "hi") {
        module.exports.send("specs", internalSpecCollector(), {clientId});
        return;
    }

    if(json.meta.msgIdResponse){
        if(responseWaiters[json.meta.msgIdResponse]){
            responseWaiters[json.meta.msgIdResponse](json.data);
        }
        return;
    }

    trigger(json.type, json.data, json.meta, rinfo);
});

module.exports = {
    clientId,
    SERVER: MODE.SERVER,
    CLIENT: MODE.CLIENT,

    /**
     * Set this to true to write all incoming UDP messages to stdout.
     */
    logMessages: false,

    /**
     * Will create an UDP message and send it to the network.
     * Either specify a target, or omit to send a broadcast to all devices.
     */
    send: (type: string, data: any, meta: any, callback?: (data: any) => void) => {
        const msgId = uuid();

        if(callback){
            responseWaiters[msgId] = callback;
        }

        if (module.exports.logMessages) {
            console.log(">>S>>", JSON.stringify({ type, data, meta: Object.assign({}, meta, {msgId}) }));
        }

        socket.send(
            JSON.stringify({
                type,
                data,
                meta: Object.assign({}, meta, {msgId})
            }),
            remotePort,
            BROADCAST_ADDR
        );
    },

    discoverClients: (timeoutMS = 1000) => new Promise<Client[]>((resolve, reject) => {
        discoveryCollector = [];
        setTimeout(() => {
            if (discoveryCollector && discoveryCollector.length > 0) {
                resolve(discoveryCollector);
                discoveryCollector = undefined;
                return;
            }
            reject("No client could be discovered");
        }, timeoutMS);
        module.exports.send("hi");
    }),

    /**
     * Will start the network adapter and bind it to the given port.
     */
    start: (mode: MODE, specCollector?: () => any) => {
        netMode = mode;

        if (mode === MODE.SERVER) {
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

    stop: () => {
        socket.close();
    },

    on: (event: string, callback: EventListenerFunction) => {
        eventListeners[event] = eventListeners[event] || [];
        eventListeners[event].push(callback);
    },

    off: (event: string, callback: EventListenerFunction) => {
        if (!eventListeners[event]) {
            return;
        }
        const index = eventListeners[event].findIndex((cb) => cb === callback);
        if (index !== -1) {
            eventListeners[event].splice(index, 1);
        }
    }
};
