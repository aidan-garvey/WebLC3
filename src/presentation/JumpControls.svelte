<!-- 
    JumpControls.svelte
        Return new memory range; Refreshes Memory simulator UI component
-->

<script>
    import { currentView } from './stores';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    // Dispatch clicked control
    function jump(control){ dispatch("jump", { text: control }) }

    // Switch to Editor button click
    function toEditor() {
        currentView.set("editor")
    }

    // Jump control handlers
    function pcClick(){ jump("pc") }
    function longJumpBackwardClick(){ jump("ljb") }
    function jumpBackwardClick(){ jump("jb") }
    function jumpForwardClick(){ jump("jf") }
    function longJumpForwardClick(){ jump("ljf") }
    function enterMemory(event){
        if(event.key == "Enter"){
            let input = document.getElementById("jump-input").value
            // Remove '0x' or 'x' prefix
            let loc = input.split('x').pop()

            // Only jump if memory location exists
            if(isHex(loc)) 
                jump(parseInt(loc, 16))
        }
    }
    function jumpMemory(){
        let jumpInput = document.getElementById("jump-input")
        let input = jumpInput.value
        if(input == "")
            input = jumpInput.placeholder
        let loc = input.split('x').pop()
        if(isHex(loc)) 
            jump(parseInt(loc, 16))
    }

    // Validate hex value
    function isHex(val) {
        let num = parseInt(val,16)
        let valid = (num.toString(16) === val.toLowerCase())
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
    }

    // Set jump express to .orig
    export let orig =""
</script>

<div id="jump-controls" role="group" aria-label="Jump controls to change visible memory range">
    <div>
        <span style="cursor:default;">JUMP</span><span class="mute"> :</span>
        <input id="jump-input" type="text" class="sourceCodePro" placeholder={orig} on:keydown={enterMemory} aria-label="Enter memory location to jump to">
        <button id="jump-express" class="material-symbols-outlined" on:click={jumpMemory} aria-label="Jump to memory pointer"> login </button>
    </div>
    <div id="jump-buttons">
        <button on:click={pcClick} aria-label="Jump to PC">PC</button>
        <button on:click={longJumpBackwardClick} aria-label="Jump backward by one page">◀</button>
        <button on:click={jumpBackwardClick} aria-label="Jump backward by a few rows">◅</button>
        <button on:click={jumpForwardClick} aria-label="Jump forward by a few rows">▻</button>
        <button on:click={longJumpForwardClick} aria-label="Jump forward by one page">▶</button>
    </div>

    <button class="switchBtn" on:click={toEditor}>Back to Editor</button>
</div>

<style>
    #jump-controls{
        width: 100%;
        display: flex;
        justify-content: space-between;
        margin-top: 2vh;
    }

    .mute{
        color: #5B5B5B;
    }

    #jump-input{
        width: 4em;
        border: none;
        outline: none;
        background: none;
        border-bottom: 1px solid #5B5B5B;
    }

    #jump-express{
        background: none;
        border: none;
        font-size: unset;
        cursor: pointer;
        transform: translateY(2px);
    }

    #jump-buttons{
        display: flex;
        font-size: 1.5em;
        height: max-content;
    }

    #jump-buttons button{
        background: none;
        border: none;
        font-size: unset;
        margin: 0 0.6em 0 0.6em;
        cursor: pointer;
    }

    #jump-buttons button:hover{
        color: var(--d-loc);
    }

    .switchBtn{
        padding: 0.8em 3em 0.8em 3em;
        text-align: center;
    }
    
    @media (max-width: 1300px) {
        .switchBtn{
            font-size: 14px !important;
            max-height: 17vh;
            max-width: 25%;
            padding: 1em 2em 1em 2em;
        }
    }
    
    @media (max-width: 900px) {
        #jump-buttons{
            display: flex;
            font-size: 1.2em;
        }
    }
    
    @media (max-width: 600px) {
        .switchBtn{
            font-size: 12px !important;
        }
    }
</style>