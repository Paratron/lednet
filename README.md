# LED net

This package allows controlling a WS2812 LED strip over UDP.

## Motivation

I started working on this project, because I am planning an (maybe) unusual setup:

I have - currently - two terrariums where I want to add controlled light for simulating sunrise/sunset scenarios.
The plan is to have a Raspberry Pi Zero W in each terrarium that is connected to a LED stripe and several sensors.

I want to have one additional Raspberry Pi 4 that is the "main server" and gathers all data, controls the light and
does other tasks. Therefore, I needed to have a slim client on the Zero Ws that only receives commands from my main server.  

## Server / SDK

The server can be imported in any nodeJS program and used to send commands to your LED strip or read its state.

## Client

The client runs on a raspberry pi with a connected WS2812 LED strip. It will process command messages
sent via UDP from a client in the same network and apply the commands on the LED strip.

For testing and/or debugging purposes, the client can also be started without a LED strip connected, or even
without running it on a raspberry. 
