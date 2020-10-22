const net = require("../shared/net");
const substituteMode = process.argv[2] === "substitute";
const led = require("./led");
const program = require("./program");
const connector = substituteMode
    ? require("./browserTestConnector")
    : require("rpi-ws281x");

let config = { leds: 0 };

try {
    config = require("./savedConfig.json");
    console.log("Continuing with previously persisted config", config);
} catch (e) {
    console.log("Using default config");
}

net.logMessages = substituteMode;
led.init(connector, config);
net.start(net.CLIENT, () => led.getConfig());

const commands = Object.assign({}, led, program);

net.on('cmd', (data: any, response: (data: any) => void) => {
    const { data: { method, args } } = data;

    if (typeof commands[method] === "undefined") {
        console.log(`Unknown method "${method}" cannot be called.`);
        return;
    }

    const result = commands[method].apply(null, args);

    if(result){
        response(result);
    }
});

console.log("LED net client started");

