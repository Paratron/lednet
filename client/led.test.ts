import { jest } from '@jest/globals'
import { Connector, ConnectorConfig } from "./led"

const led = require("./led");

let renderHistory: Uint32Array[] = [];

const testConnector: Connector = {
    configure: jest.fn(),
    reset: jest.fn(),
    render: jest.fn((pixels) => {
        renderHistory.push(pixels);
    }),
    sleep: jest.fn()
}

describe("LED", () => {
    it("setColor", () => {
        led.init(testConnector, { leds: 16 });
        led.setColor(255, 0, 0);

        expect(testConnector.render).toHaveBeenCalledTimes(1);

        renderHistory[0].forEach(val => {
            expect(val).toBe(0xFF0000);
        });
    });

    it("setColorForPixel", () => {
        led.init(testConnector, { leds: 16 });
        led.setColor(0, 0, 0);
        led.setColorForPixel(0, 255, 0, 0);

        expect(testConnector.render).toHaveBeenCalledTimes(2);

        renderHistory[1].forEach((val, index) => {
            expect(val).toBe(index === 0 ? 0xFF0000 : 0x000000);
        });
    });
});
