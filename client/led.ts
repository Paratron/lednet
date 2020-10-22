const d3 = require("d3");

export interface ConnectorConfig {
    leds: number;
    dma?: number;
    brightness?: number;
    gpio?: number;
    type?: "rgb" | "rbg" | "grb" | "gbr" | "bgr" | "brg";
}

export interface Connector {
    configure: (config: ConnectorConfig) => void;
    reset: () => void;
    render: (pixels: Uint32Array) => void;
    sleep: (milliseconds: number) => void;
}

let connector: Connector;
let config: ConnectorConfig;
let pixels: Uint32Array;

let rg = 0;
let gg = 0;
let bg = 0;
let brightnessG = 1;

function init(useConnector: Connector, newConfig: ConnectorConfig) {
    connector = useConnector;
    setConfig(newConfig);
}

function setConfig(newConfig: ConnectorConfig) {
    if (config) {
        connector.reset();
        connector.sleep(500);
    }

    if (!newConfig || typeof newConfig.leds !== "number") {
        return;
    }

    config = newConfig;
    connector.configure(config);
    pixels = new Uint32Array(config.leds);
}

function getConfig() {
    return Object.assign({}, config);
}

function setRGB(r: number, g: number, b: number, render = true) {
    rg = r;
    gg = g;
    bg = b;
    pixels.forEach((p, i) => setPixelRGB(i, r, g, b, false));
    render && connector.render(pixels);
}

function setHSL(h: number, s: number, l: number, render = true) {
    const { r, g, b } = d3.hsl(h, s, l).rgb();
    setRGB(r, g, b, render);
}

function setPixelRGB(index: number, r: number, g: number, b: number, render = true) {
    pixels[index] = (r << 16) | (g << 8) | b;
    render && connector.render(pixels);
}

function setPixelHSL(index: number, h: number, s: number, l: number, render = true){
    const { r, g, b } = d3.hsl(h, s, l).rgb();
    setPixelRGB(index, r, g, b, render);
}

function tweenToRGB(r: number, g: number, b: number, durationMS: number = 1000) {
    const previousR = rg;
    const previousG = gg;
    const previousB = bg;

    const getT = d3.scaleLinear().domain([Date.now(), Date.now() + durationMS]).range([0, 1]);

    const interpolateR = d3.interpolateNumber(previousR, r);
    const interpolateG = d3.interpolateNumber(previousG, g);
    const interpolateB = d3.interpolateNumber(previousB, b);

    let t = getT(Date.now());
    while (t < 1) {
        t = getT(Date.now());
        setRGB(
            interpolateR(t),
            interpolateG(t),
            interpolateB(t)
        );
    }
}

function tweenToHSL(h: number, s: number, l: number, durationMS: number = 1000) {
    const { r, g, b } = d3.hsl(h, s, l).rgb();
    tweenToRGB(r, g, b, durationMS);
}

function brightness(value: number) {
    const activeLEDs = Math.round(pixels.length / (value * pixels.length));
    const previousR = rg;
    const previousG = gg;
    const previousB = bg;
    brightnessG = value;

    for (let i = 0; i < pixels.length; i++) {
        if (i % activeLEDs === 0) {
            setPixelRGB(i, previousR, previousG, previousB, false);
        } else {
            setPixelRGB(i, 0, 0, 0, false);
        }
    }
    connector.render(pixels);
}

function tweenToBrightness(value: number) {
    const previousBrightness = brightnessG;
    let i = 0;

    const interpolator = d3.interpolateNumber(previousBrightness, value);

    while (i < 1) {
        i += .1;
        brightness(interpolator(i));
    }
}

function off() {
    setRGB(0, 0, 0);
}

module.exports = {
    setRGB,
    setHSL,
    brightness,
    tweenToBrightness,
    setPixelRGB,
    setPixelHSL,
    tweenToRGB,
    tweenToHSL,
    init,
    configure: setConfig,
    getConfig,
    off
};
