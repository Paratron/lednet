const net = require("../shared/net");
const substituteMode = process.argv[2] === "substitute";
const led = require("./led");
const connector = substituteMode
    ? require("./browserTestConnector")
    : require("rpi-ws281x");

net.logMessages = true;
led.init(connector, { leds: 0 });
net.start(net.CLIENT, () => led.getConfig());

net.on('cmd', (data: any) => {
    const { data: { method, args } } = data;

    if (typeof led[method] === "undefined") {
        console.log(`Unknown method "${method}" cannot be called.`);
        return;
    }

    led[method].apply(null, args);
});

console.log("LED net client started");

