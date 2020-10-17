# LED net

This package allows controlling a WS2812 LED strip over UDP.

## Server / SDK

The server can be imported in any nodeJS program and used to send commands to your LED strip or read its state.

## Client

The client runs on a raspberry pi with a connected WS2812 LED strip. It will process command messages
sent via UDP from a client in the same network and apply the commands on the LED strip.
