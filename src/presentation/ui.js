/*
 * ui.js
 * 
 *  Functions to modify states for the following UI components
 *      - Console.svelte 
 *      - SimulatorStatus.svelte
 */

import { activeStoplight, consoleSelected, UIReady } from "./stores"

// Signal that UI is ready to update
function updateUI(){
    UIReady.set(true)
}


// Replace all contents of Console with given string
function printConsole(msg){
    if(msg)
        modifyConsole(msg)
}


// Append to Console with given string
function appendConsole(msg){
    if(msg)
        modifyConsole(msg, true)
}


// Clear all console text
function clearConsole(){
    modifyConsole("console empty", false, true) 
}


// Select Console (Window becomes key interruptable)
function selectConsole(){
    try{
        let theConsole = document.getElementById("c-ctr")
        theConsole.classList.add("console-highlighted")
        consoleSelected.set(true)
    } catch {}
}


// Deselect Console
function deselectConsole(){
    try{
        let theConsole = document.getElementById("c-ctr")
        theConsole.classList.remove("console-highlighted")
        consoleSelected.set(false)
    } catch {}
}


/* Helper to append, replace, or clear Console
 *  Parameters:
 *      msg - String to print
 *      append - Boolean: Append string to Console
 *      clear - Boolean: Clear Console
 */
function modifyConsole(msg, append=false, clear=false){
    let consoleInner = document.getElementById("console-inner")
    if(consoleInner){

        if(append){ 
            // If there is a "console empty" message in the UI, remove it
            let innerText = consoleInner.innerText
            if(innerText == "console empty")
                consoleInner.innerText = ""
            
            // Encode '<' and '>' to appear on HTML
            msg = msg.replace(/</gi, "&lt;")
            msg = msg.replace(/>/gi, "&gt;")
            consoleInner.innerHTML += msg

        }
        else { 
            msg = msg.replace(/</gi, "&lt;")
            msg = msg.replace(/>/gi, "&gt;")
            consoleInner.innerHTML = msg 
        }
        
        if(clear){ consoleInner.classList.add("empty") }
        else { consoleInner.classList.remove("empty") }

        // Scroll to bottom of Console
        consoleInner.scrollTop = consoleInner.scrollHeight;

    } 
    else
        console.error("Console component not found in UI.")
}


// Set NOT READY on SimulatorStatus
function setSimulatorNotReady(){
    activeStoplight.set("sim-status-not-ready")
}


// Set READY on SimulatorStatus
function setSimulatorReady(){
    activeStoplight.set("sim-status-ready")
}


// Set RUNNING on SimulatorStatus
function setSimulatorRunning(){
    activeStoplight.set("sim-status-running")
}


export default {
    updateUI,
    printConsole,
    appendConsole, 
    clearConsole,
    selectConsole,
    deselectConsole,
    setSimulatorNotReady,
    setSimulatorReady,
    setSimulatorRunning
}