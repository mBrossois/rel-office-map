/// <reference types="@workadventure/iframe-api-typings" />

import { CoWebsite } from "@workadventure/iframe-api-typings";
import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log('Scripting API ready');
    console.log('Player tags: ',WA.player.tags)

    let gameWebsite: CoWebsite
    let popup: any

    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes();
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    })

    WA.room.area.onLeave('clock').subscribe(closePopup)
    

    WA.room.area.onEnter('UpdateGame').subscribe(async() => {
        popup = WA.ui.openPopup('UpdateGame', 'Type the url to the website to be opened in your chat!',  [])
        
        WA.chat.onChatMessage((message => {
            WA.state.urlGame = message            
        }));
    })

    WA.room.area.onLeave('UpdateGame').subscribe(async() => {
        if(popup) {
            popup.close()
        }
    })

    WA.room.area.onEnter('jitsiMeetingRoomChill').subscribe(async() => {
        gameWebsite = await WA.nav.openCoWebSite(WA.state.hasVariable('urlGame') ? WA.state.loadVariable('urlGame') as string : 'https://skribbl.io', true,  "", 50, 1, false, true)
    })

    WA.room.area.onLeave('jitsiMeetingRoomChill').subscribe(async() => {
        if(gameWebsite) {
            gameWebsite.close()
        }
    })

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};
