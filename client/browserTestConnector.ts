import { Connector, ConnectorConfig } from "./led";

const socketIO = require('socket.io');

const io = socketIO(80, {
    origins: '*:*'
});

const ns = io.of("ns");
const room = ns.to("default");

let pixels: Uint32Array;
let config: ConnectorConfig;

io.on("connection", (socket: any) => {
    console.log("New connection from browser");
    socket.join("default");
    socket.emit("configure", config);
    socket.emit("render", pixels);
});

const connector: Connector = {
    configure: (nextConfig: ConnectorConfig) => {
        config = nextConfig;
        room.emit("configure", config);
    },
    reset: () => {

    },
    render: (nextPixels: Uint32Array) => {
        pixels = nextPixels;
        io.emit("render", pixels);
    },
    sleep: (milliseconds: number) => {

    }
};

console.log("Using Browser Test Connector");

module.exports = connector;
