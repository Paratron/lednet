const net = require("../shared/net");

net.logMessages = true;
net.start(net.SERVER);

let target;

function send(message, data, meta){
    net.send("cmd", {message: message, arguments: data, meta: Object.assign({}, {instanceId: target})});
}

module.exports = {
    discoverClients: net.discoverClients,
    useClient: ({instanceId}) => target = instanceId,

    init: (options) => send("init", options, ),
    setColor: (r, g, b) => send("setColor", {r,g,b}, {instanceId: target})
};
