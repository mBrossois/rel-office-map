import { ActionMessage } from "@workadventure/iframe-api-typings";

export interface RaceType{
    state: string;
    timer: number;
    checkpoints: {
        [key: string]: boolean
    }
    roomCheckPointState: {
        value?: ActionMessage;
    }
    roomFinishState: {
        value?: ActionMessage;
    }
    roomStartState: {
        value?: ActionMessage;
        timer: number;
    };
}