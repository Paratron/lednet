const net = require("../shared/net");
const led = require("./led");

net.start(net.SERVER);

net.on('cmd', (data) => {
    const {method, ...arguments} = data;
    led[method].call(arguments);
});

