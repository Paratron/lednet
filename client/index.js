const net = require("../shared/net");
const led = require("./led");

net.start(net.CLIENT, led.getConfig);

net.on('cmd', (data) => {
    console.log("Received command", data);

    const {method, ...arguments} = data;
    led[method].call(arguments);
});

console.log("LED net client started");

