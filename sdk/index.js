const net = require("../shared/net");

net.start(net.SERVER);

module.exports = {
    discoverClients: net.discoverClients,

    setColor: (r, g, b) => net.send("setColor", {r,g,b})
};
