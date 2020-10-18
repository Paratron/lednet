const ws281x = require('rpi-ws281x');

let isConfigured = false;

let config;
let pixels;

function init(newConfig) {
    if (isConfigured) {
        ws281x.reset();
        ws281x.sleep(500);
    }
    isConfigured = true;
    config = newConfig;
    ws281x.configure(config);
    pixels = new Uint32Array(config.leds);
}

function getConfig() {
    return Object.assign({}, config);
}

let rg = 0;
let gg = 0;
let bg = 0;
let brightnessG = 1;

function setColor(r, g, b, render = true) {
    rg = r;
    gg = g;
    bg = b;
    pixels.forEach((p, i) => setColorForPixel(i, r, g, b, false));

    render && ws281x.render(pixels);
}

function setColorForPixel(index, r, g, b, render = true) {
    pixels[index] = (r << 16) | (g << 8) | b;
    render && ws281x.render(pixels);
}

const fixed = (inNumber) => Number.parseFloat(inNumber.toFixed(2));
const tween = (sourceVal, targetVal, t) => fixed(((targetVal - sourceVal) * t) + sourceVal);


function tweenToColor(r, g, b) {
    const previousR = rg;
    const previousG = gg;
    const previousB = bg;

    let i = 0;
    while (i < 1) {
        i += .01;
        setColor(tween(previousR, r, i), tween(previousG, g, i), tween(previousB, b, i));
    }
}

function brightness(value) {
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
    ws281x.render(pixels);
}

function tweenToBrightness(value) {
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
    getConfig,
    off
};
