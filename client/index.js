const net = require("../shared/net");
const led = require("./led");

net.logMessages = true;
net.start(net.CLIENT);

net.on('cmd', (data) => {
    console.log("Received command", data);
    const {method, ...arguments} = data;
    led[method].apply(null, Object.values(arguments));
});

console.log("LED net client started");

