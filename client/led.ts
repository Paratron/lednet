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

function setConfig(newConfig: ConnectorConfig){
    if (config) {
        connector.reset();
        connector.sleep(500);
    }

    if(!newConfig || typeof newConfig.leds !== "number"){
        return;
    }

    config = newConfig;
    connector.configure(config);
    pixels = new Uint32Array(config.leds);
}

function getConfig() {
    return Object.assign({}, config);
}

function setColor(r: number, g: number, b: number, render = true) {
    rg = r;
    gg = g;
    bg = b;
    pixels.forEach((p, i) => setColorForPixel(i, r, g, b, false));
    render && connector.render(pixels);
}

function setColorForPixel(index: number, r: number, g: number, b: number, render = true) {
    pixels[index] = (r << 16) | (g << 8) | b;
    render && connector.render(pixels);
}

const fixed = (inNumber: number) => Number.parseFloat(inNumber.toFixed(2));
const tween = (sourceVal: number, targetVal: number, t: number) => fixed(((targetVal - sourceVal) * t) + sourceVal);


function tweenToColor(r: number, g: number, b: number) {
    const previousR = rg;
    const previousG = gg;
    const previousB = bg;

    let i = 0;
    while (i < 1) {
        i += .01;
        setColor(tween(previousR, r, i), tween(previousG, g, i), tween(previousB, b, i));
    }
}

function brightness(value: number) {
    const activeLEDs = Math.round(pixels.length / (value * pixels.length));
    const previousR = rg;
    const previousG = gg;
    const previousB = bg;
    brightnessG = value;

    for (let i = 0; i < pixels.length; i++) {
        if (i % activeLEDs === 0) {
            setColorForPixel(i, previousR, previousG, previousB, false);
        } else {
            setColorForPixel(i, 0, 0, 0, false);
        }
    }
    connector.render(pixels);
}

function tweenToBrightness(value: number) {
    const previousBrightness = brightnessG;
    let i = 0;
    while (i < 1) {
        i += .1;
        brightness(tween(previousBrightness, value, i));
    }
}

function off() {
    setColor(0, 0, 0);
}

module.exports = {
    setColor,
    brightness,
    tweenToBrightness,
    setColorForPixel,
    tweenToColor,
    tween,
    init,
    configure: setConfig,
    getConfig,
    off
};
