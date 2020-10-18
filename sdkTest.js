const led = require("./sdk");

(async function () {
    const clients = await led.discoverClients();

    console.log(`Found client at ${clients[0].address}`);

    led.useClient(clients[0]);


    led.init({leds: 144, type : "grb"});


    led.setColor(25, 0, 0);
})();
