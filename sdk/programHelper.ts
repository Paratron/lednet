const d3 = require("d3");
import { Program, ProgramCommand } from "../client/program";

type InternalCommandEntry = { time: number, cmd: string, args: any[] };

function calculateProgramDuration(commands: InternalCommandEntry[]): number {
    return commands.reduce((duration: number, { time, cmd, args}) => {
        if (time > duration) {
            duration = time;
            if(cmd.substr(0, 5) === "tween"){
                duration += args[args.length - 2] || 1000;
            }
        }
        return duration;
    }, 0);
}

function finalizeCommands(commands: InternalCommandEntry[], totalDuration: number): ProgramCommand[] {
    const getT = d3.scaleLinear().domain([0, totalDuration]).range([0, 1]);
    return commands.map(({time, cmd, args}) => {
        return {
            method: cmd,
            args,
            t: getT(time)
        };
    });
}

function createProgram() {
    const commands: InternalCommandEntry[] = [];

    function addCommand(time: number, cmd: string, args: any[]) {
        commands.push({ time, cmd, args });
    }

    return {
        commands,
        addCommand: (timeMS: number) => ({
            setRGB: (r: number, g: number, b: number) => addCommand(timeMS, "setRGB", [r, g, b]),
            setHSL: (h: number, s: number, l: number) => addCommand(timeMS, "setHSL", [h, s, l]),
            setPixelRGB: (index: number, r: number, g: number, b: number) => addCommand(timeMS, "setPixelRGB", [index, r, g, b]),
            setPixelHSL: (index: number, h: number, s: number, l: number) => addCommand(timeMS, "setPixelHSL", [index, h, s, l]),
            tweenToRGB: (r: number, g: number, b: number, durationMS?: number, updateSpeedMS?: number) => addCommand(timeMS, "tweenToRGB", [r, g, b, durationMS, updateSpeedMS]),
            tweenToHSL: (h: number, s: number, l: number, durationMS?: number, updateSpeedMS?: number) => addCommand(timeMS, "tweenToHSL", [h, s, l, durationMS, updateSpeedMS]),
            brightness: (value: number) => addCommand(timeMS, "brightness", [value]),
            tweenToBrightness: (value: number, durationMS?: number, updateSpeedMS?: number) => addCommand(timeMS, "tweenToBrightness", [value, durationMS, updateSpeedMS])
        }),
        /**
         * Calculates the final program data to be sent to the lednet client
         */
        getFinalProgram: (name: string): Program => {
            return {
                name,
                duration: calculateProgramDuration(commands),
                commands: finalizeCommands(commands, calculateProgramDuration(commands))
            };
        }
    };
}

module.exports = createProgram;
