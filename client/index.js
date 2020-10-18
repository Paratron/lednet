const net = require("../shared/net");
const led = require("./led");

net.logMessages = true;
net.start(net.CLIENT);

net.on('cmd', (data) => {
    console.log("Received command", data);
    const {method, arguments} = data;

    if (typeof led[method] === "undefined") {
        console.log(`Unknown method "${method}" cannot be called.`);
        return;
    }

    led[method].apply(null, arguments);
});

console.log("LED net client started");

