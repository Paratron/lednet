import ErrnoException = NodeJS.ErrnoException

const d3 = require("d3");
const led = require("./led");

let programs: { [key: string]: Program } = {};
let activeProgramName: string | undefined;
let activeProgramInterval: NodeJS.Timeout;
let activeProgramProgress: number | undefined;

export interface Program {
    /** unique name to identify and start the program */
    name: string;
    /** Define a crontab to start the program automatically */
    crontab?: string;
    /** Should the program be started automatically or manually */
    autostart?: boolean;
    /** How long should the program run in seconds */
    duration: number;
    /** Commands to execute across the program runtime */
    commands: ProgramCommand[];
}

export interface ProgramCommand {
    /** Any of the available commands in the led client. */
    method: string;
    /** Array of args the command needs. */
    args: any[];
    /** t > 0 < 1 - specifies when the command should be executed during the program runtime. */
    t: number;
}

function savePrograms() {
    require("fs").writeFile("./programs.json", JSON.stringify(programs), () => {
    });
}

function loadPrograms() {
    require("fs").readFile("./programs.json", "utf8", (err: ErrnoException | null, data: string) => {
        if (err) {
            return;
        }

        programs = JSON.parse(data);
    });
}

function setProgram(program: Program) {
    programs[program.name] = program;
    savePrograms();
}

function listPrograms(): string[] {
    return Object.values(programs).map(p => p.name);
}

function getProgram(name: string): Program | null {
    if (!programs[name]) {
        return null;
    }

    return Object.assign({}, programs[name]);
}

function getActiveProgram(): { name: string, progress: number } | null {
    if (!activeProgramName || activeProgramProgress === undefined) {
        return null;
    }

    return { name: activeProgramName, progress: activeProgramProgress };
}

function removeProgram(name: string) {
    if (!programs[name]) {
        return null;
    }

    if (activeProgramName === name) {
        stopProgram();
    }

    delete programs[name];

    savePrograms();

    return true;
}

function startProgram(name: string, startTime: number = Date.now()): boolean {
    if (!programs[name]) {
        return false;
    }

    if (activeProgramName !== undefined) {
        stopProgram();
    }

    activeProgramName = name;
    const program = programs[name];

    const getT = d3.scaleLinear()
        .domain([startTime, startTime + program.duration])
        .range([0, 1]);

    let lastExecutedCommandIndex = -1;
    activeProgramProgress = 0;
    activeProgramInterval = setInterval(() => {
        activeProgramProgress = getT(Date.now());
        const c = getProgramCommand(program.commands, activeProgramProgress as number, lastExecutedCommandIndex);
        if (c) {
            lastExecutedCommandIndex = program.commands.indexOf(c);
            const { method, args } = c;
            led[method].apply(null, args);
        }

        if (lastExecutedCommandIndex === program.commands.length - 1 || activeProgramProgress === 1) {
            stopProgram();
        }
    }, 100);

    return true;
}

function getProgramCommand(commands: ProgramCommand[], t: number, lastCommandIndex: number): ProgramCommand | null {
    const commandIndex = commands.findIndex(cmd => cmd.t > t);

    if (commandIndex === -1 || commandIndex <= lastCommandIndex) {
        return null;
    }

    return commands[commandIndex];
}

function stopProgram() {
    clearInterval(activeProgramInterval);
    activeProgramProgress = undefined;
    activeProgramName = undefined;
}

loadPrograms();

module.exports = {
    listPrograms,
    setProgram,
    getProgram,
    getActiveProgram,
    removeProgram,
    startProgram,
    stopProgram
};
