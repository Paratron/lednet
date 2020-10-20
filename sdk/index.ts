import { ConnectorConfig } from "../client/led"
import { Client } from "../shared/net"

const net = require("../shared/net");

function remoteFunctionCall(method: string, data: any, clientId: string){
    net.send("cmd", {method, args: data, meta: Object.assign({}, {clientId})});
}

interface ClientInterface extends Client {
    configure: (options: ConnectorConfig) => void;
    setColor: (r: number, g: number, b: number) => void;
    tweenToColor: (r: number, g: number, b: number) => void;
}

const clientInterface = (client: Client): ClientInterface => ({
    ...client,
    configure: (options: ConnectorConfig) => remoteFunctionCall("configure", [options], client.clientId ),
    setColor: (r: number, g: number, b: number) => remoteFunctionCall("setColor", [r,g,b], client.clientId),
    tweenToColor: (r: number, g: number, b: number) => remoteFunctionCall("tweenToColor", [r,g,b], client.clientId)
});

module.exports = (logMessages = false) => {
    net.logMessages = logMessages;
    net.start(net.SERVER);

    return {
        discoverClients: async (): Promise<ClientInterface[]> => {
            const clients = await net.discoverClients();
            return clients.map(clientInterface);
        }
    };
};
