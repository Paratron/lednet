import { ConnectorConfig } from "../client/led"
import { Client } from "../shared/net"

const net = require("../shared/net");

function remoteFunctionCall(method: string, data: any, clientId: string){
    net.send("cmd", {method, args: data, meta: Object.assign({}, {clientId})});
}

interface ClientInterface extends Client {
    configure: (options: ConnectorConfig) => void;
    setRGB: (r: number, g: number, b: number) => void;
    setHSL: (h: number, s: number, l: number) => void;
    setPixelRGB: (index: number, r: number, g: number, b: number) => void;
    setPixelHSL: (index: number, h: number, s: number, l: number) => void;
    tweenToRGB: (r: number, g: number, b: number, durationMS?: number, updateSpeedMS?: number) => void;
    tweenToHSL: (h: number, s: number, l: number, durationMS?: number, updateSpeedMS?: number) => void;
    brightness: (value: number) => void;
    tweenToBrightness: (value: number) => void;
}

const clientInterface = (client: Client): ClientInterface => ({
    ...client,
    configure: (options: ConnectorConfig) => remoteFunctionCall("configure", [options], client.clientId ),
    setRGB: (r: number, g: number, b: number) => remoteFunctionCall("setRGB", [r,g,b], client.clientId),
    setHSL: (h: number, s: number, l: number) => remoteFunctionCall("setHSL", [h,s,l], client.clientId),
    setPixelRGB: (index: number, r: number, g: number, b: number) => remoteFunctionCall("setPixelRGB", [index,r,g,b], client.clientId),
    setPixelHSL: (index: number, h: number, s: number, l: number) => remoteFunctionCall("setPixelHSL", [index,h,s,l], client.clientId),
    tweenToRGB: (r: number, g: number, b: number, durationMS: number = 1000, updateSpeedMS) => remoteFunctionCall("tweenToRGB", [r,g,b,durationMS,updateSpeedMS], client.clientId),
    tweenToHSL: (h: number, s: number, l: number, durationMS: number = 1000, updateSpeedMS) => remoteFunctionCall("tweenToHSL", [h,s,l,durationMS,updateSpeedMS], client.clientId),
    brightness: (value: number) => remoteFunctionCall("brightness", [value], client.clientId),
    tweenToBrightness: (value: number) => remoteFunctionCall("tweenToBrightness", [value], client.clientId),
});

module.exports = (logMessages = false) => {
    net.logMessages = logMessages;
    net.start(net.SERVER);

    return {
        discoverClients: async (): Promise<ClientInterface[]> => {
            const clients = await net.discoverClients();
            return clients.map(clientInterface);
        },
        stop: net.stop
    };
};
