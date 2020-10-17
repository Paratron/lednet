const led = require("./sdk");

(async function () {
    const clients = await led.discoverClients();
    led.useClient(clients[0]);


})();
