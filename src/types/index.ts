import { ActionMessage } from "@workadventure/iframe-api-typings";

export interface RaceType{
    state: string;
    timer: number;
    checkpoints: {
        checkpointOne: boolean;
        checkpointTwo: boolean;
        checkpointThree: boolean;
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