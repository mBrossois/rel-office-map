import { ButtonDescriptor, Popup } from "@workadventure/iframe-api-typings"
import { RaceType } from "../types"

const raceValues: RaceType = {state: 'init', timer: 0, roomCheckPointState: {}, roomStartState: { timer: 3}, checkpoints: { checkpointOne: false, checkpointTwo: false, checkpointThree: false }, roomFinishState: {}}
let counterInterval: any

export default function setupRace() {
   setupStartArea()
   setupCheckpoints()
   setupFinishArea()
   numberOfCheckPointsOpen()
   setupStats()
}

function startRace() {
    raceValues.state = 'ongoing'
    raceValues.checkpoints = { checkpointOne: false, checkpointTwo: false, checkpointThree: false }
    raceValues.timer = new Date().getTime()
}

function setupStartArea() {
    WA.room.area.onEnter('start').subscribe(() => {
        if(raceValues.state === 'init') {
            raceValues.state = 'counter'
            raceValues.timer = 0;
            raceValues.roomStartState.timer = 3
            raceValues.roomStartState.value = WA.ui.displayActionMessage({
                message: `De race zal beginnen in ${raceValues.roomStartState.timer}. 
                Druk op spatie om te beeindigen.`, 
                type: "message", 
                callback: () => {
                    clearInterval(counterInterval)
                    raceValues.roomStartState.timer = 3
                }
            })
    
            counterInterval = setInterval(() => {
                if(raceValues.roomStartState.value) {
                    raceValues.roomStartState.value.remove()
                }
    
                raceValues.roomStartState.timer -= 1;
                raceValues.roomStartState.value = WA.ui.displayActionMessage({
                    message: `De race zal beginnen in ${raceValues.roomStartState.timer}. 
                    Druk op spatie om te beeindigen.`, 
                    type: "message", 
                    callback: () => {
                        clearInterval(counterInterval)
                        raceValues.roomStartState.timer = 3
                    }
                })
                if(raceValues.roomStartState.timer === 0) {
                    clearInterval(counterInterval)
                    raceValues.roomStartState.value.remove()
                    raceValues.roomStartState.value = WA.ui.displayActionMessage({
                        message: 'GOOOOO!', 
                        type: "message", 
                        callback: () => {}
                    })
                    raceValues.roomStartState.timer = 3
                    startRace()
                }
            }, 1000)
        }
    })

    WA.room.area.onLeave('start').subscribe(() => {

        if(raceValues.state === 'counter' && raceValues.roomStartState.value) {
            clearInterval(counterInterval);
            raceValues.roomStartState.value.remove()
            raceValues.state = 'init'
        } else if(raceValues.state === 'ongoing' && raceValues.roomStartState.value) {
            raceValues.roomStartState.value.remove()

        }
    })
}

function numberOfCheckPointsOpen(): number {
    let numberOfCheckPoints = 0;
    for(let checkpoint in raceValues.checkpoints) {
        numberOfCheckPoints += raceValues.checkpoints[checkpoint] ? 0 : 1
    }

    return numberOfCheckPoints
}

function setupFinishArea() {
    WA.room.area.onEnter('finish').subscribe(() => {
        if(numberOfCheckPointsOpen() === 0 && raceValues.state === 'ongoing') {
            const finishedTime = (new Date().getTime() - raceValues.timer) / 1000
            raceValues.roomFinishState.value = WA.ui.displayActionMessage({
                message: `Gefinished! Met een tijd van ${ finishedTime }`, 
                type: "message", 
                callback: () => {
                }
            })
            let stats: Array<{name: string, time: number}> | undefined = WA.state.loadVariable('raceStats') as Array<any> | undefined
            if(stats === undefined) {
                stats = [{name: WA.player.name, time: finishedTime }]
                WA.state.saveVariable('raceStats', stats)
                
            } else  {
                const userIndex = stats.findIndex(stat => stat.name === WA.player.name)
                if(userIndex >= 0 && stats[userIndex].time > finishedTime) {
                    stats[userIndex].time = finishedTime
                    WA.state.saveVariable('raceStats', [])
                    WA.state.saveVariable('raceStats', stats)

                } else if(userIndex < 0) {
                    stats.push({ name: WA.player.name, time: finishedTime })
                    WA.state.saveVariable('raceStats', [])
                    WA.state.saveVariable('raceStats', stats)
                }

            }
            raceValues.state = 'init'

        } else if(raceValues.state === 'ongoing') {
            raceValues.roomFinishState.value = WA.ui.displayActionMessage({
                message: `Je mist nog ${numberOfCheckPointsOpen()} check points!`, 
                type: "message", 
                callback: () => {
                }
            })
        }
    })

    WA.room.area.onLeave('finish').subscribe(() => {
        if(raceValues.roomFinishState.value) {
            raceValues.roomFinishState.value.remove()
        }
    })
}

function setupCheckpoints() {
    for(const checkpoint in raceValues.checkpoints) {
        WA.room.area.onEnter(checkpoint).subscribe(() => {
            if(!raceValues.checkpoints[checkpoint] && raceValues.state === 'ongoing') {
                raceValues.roomCheckPointState.value = WA.ui.displayActionMessage({
                    message: `${checkpoint} - ${ (new Date().getTime() - raceValues.timer) / 1000}`, 
                    type: "message", 
                    callback: () => {
                    }
                })

                raceValues.checkpoints[checkpoint] = true;
            }
        })

        WA.room.area.onLeave(checkpoint).subscribe(() => {
            if(raceValues.checkpoints[checkpoint] && raceValues.state === 'ongoing' && raceValues.roomCheckPointState.value) {
                setTimeout(() => {
                    if(raceValues.roomCheckPointState.value) raceValues.roomCheckPointState.value.remove()
                }, 1000)
            }

        })
    }
}

function getStats(stats: Array<{name: string, time: number}>, page: number) {
    let statList = ''
    stats.sort((a, b) => {
        return a.time - b.time
    })
    stats = stats.slice((page * 3), (page * 3 + 3))
    for(let stat in stats) {
        statList += `\n ${Number(stat) + 1 + page * 3}. ${stats[stat].name} - ${stats[stat].time}`
    }
    return statList
}

function getButton(stats: Array<{name: string, time: number}>, page: number): ButtonDescriptor[] {
    
    const buttons: ButtonDescriptor[] = []

    if(page !== 0) {
        buttons.push({
            label: "Vorige", className: "normal", callback: (popup: Popup) => {
                popup.close()
                openPopupStats(stats, page - 1)
            }
        })
    }
    if(page < stats.length / 3 - 1 ) {
        buttons.push({
            label: "Volgende", className: "normal", callback: (popup) => {
                popup.close()
                openPopupStats(stats, page + 1)
            }
        })
    }

    return buttons

}

function openPopupStats(stats: Array<{name: string, time: number}>, page: number) {
   return WA.ui.openPopup('resultsPopup', `Stats race: ${getStats(stats, page)}`, getButton(stats, page))
}

function setupStats() {
    let resultValue: Popup
    WA.room.area.onEnter('results').subscribe(() => {
        const stats = WA.state.loadVariable('raceStats') as Array<any> | undefined
        
        if(stats) {
            resultValue = openPopupStats(stats, 0)
        }
    })

    WA.room.area.onLeave('results').subscribe(() => {
        if(resultValue) resultValue.close()
    })
}