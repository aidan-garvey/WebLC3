/**
 * ui.js
 * 
 * Modify UI components
 */


function printConsole(msg){
    if(msg)
        modifyConsole(msg)
}

function appendConsole(msg){
    if(msg)
        modifyConsole(msg, true)
}

function clearConsole(){
    modifyConsole("console empty", false, true) 
}

function modifyConsole(msg, append=false, clear=false){
    let consoleInner = document.getElementById("console-inner")
    if(consoleInner){

        if(append){ 
            // If there is a 'console empty' message in the UI, remove it
            let innerText = consoleInner.innerText
            if(innerText == "console empty")
                consoleInner.innerText = ""
            
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

    } else {
        console.error("Console component not found in UI.")
    }
}

export default {
    printConsole,
    appendConsole, 
    clearConsole
}