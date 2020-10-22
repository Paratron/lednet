import { ConnectorConfig } from "../client/led"
import { Client } from "../shared/net"
import { Program } from "../client/program"

const net = require("../shared/net");

function rawRemoteFunctionCall(clientId: string) {
    function remoteFunctionCall(method: string, data: any, awaitResult?: false): void
    function remoteFunctionCall<T>(method: string, data: any, awaitResult: true): Promise<T>
    function remoteFunctionCall(method: string, data: any, awaitResult: boolean = false) {
        if (awaitResult) {
            return new Promise((resolve, reject) => {
                net.send("cmd", { method, args: data, meta: Object.assign({}, { clientId }) }, null, (data: any) => {
                    if (data === null) {
                        reject();
                    }
                    resolve(data);
                });
            });
        }
        net.send("cmd", { method, args: data, meta: Object.assign({}, { clientId }) });
    };

    return remoteFunctionCall;
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

    setProgram: (program: Program) => void;
    listPrograms: () => Promise<string[]>;
    getProgram: (name: string) => Promise<Program>;
    getActiveProgram: () => Promise<{ name: string, progress: number }>;
    removeProgram: (name: string) => Promise<boolean>;
    startProgram: (name: string) => Promise<boolean>;
    stopProgram: () => void;
}

const clientInterface = (client: Client): ClientInterface => {
    const remoteFunctionCall = rawRemoteFunctionCall(client.clientId);

    return {
        ...client,
        configure: (options: ConnectorConfig) => remoteFunctionCall("configure", [options]),
        setRGB: (r: number, g: number, b: number) => remoteFunctionCall("setRGB", [r, g, b]),
        setHSL: (h: number, s: number, l: number) => remoteFunctionCall("setHSL", [h, s, l]),
        setPixelRGB: (index: number, r: number, g: number, b: number) => remoteFunctionCall("setPixelRGB", [index, r, g, b]),
        setPixelHSL: (index: number, h: number, s: number, l: number) => remoteFunctionCall("setPixelHSL", [index, h, s, l]),
        tweenToRGB: (r: number, g: number, b: number, durationMS: number = 1000, updateSpeedMS) => remoteFunctionCall("tweenToRGB", [r, g, b, durationMS, updateSpeedMS]),
        tweenToHSL: (h: number, s: number, l: number, durationMS: number = 1000, updateSpeedMS) => remoteFunctionCall("tweenToHSL", [h, s, l, durationMS, updateSpeedMS]),
        brightness: (value: number) => remoteFunctionCall("brightness", [value]),
        tweenToBrightness: (value: number) => remoteFunctionCall("tweenToBrightness", [value]),

        setProgram: (program: Program) => remoteFunctionCall("setProgram", [program]),
        listPrograms: () => remoteFunctionCall("listPrograms", null, true),
        getProgram: (name: string) => remoteFunctionCall("getProgram", [name], true),
        getActiveProgram: () => remoteFunctionCall("getActiveProgram", null, true),
        removeProgram: (name: string) => remoteFunctionCall("removeProgram", [name], true),
        startProgram: (name: string) => remoteFunctionCall("startProgram", [name], true),
        stopProgram: () => remoteFunctionCall("stopProgram", null)
    };
};

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
