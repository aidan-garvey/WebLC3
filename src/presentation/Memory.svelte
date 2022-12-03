<!-- 
    Memory.svelte
        Reflect value stored and instruction mapped in CPU memory
-->

<script>
    import { onMount } from 'svelte'
    import { reloadOverride } from './stores.js';
    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

    // Dispatch updated PC
    function updatePC(newPC) {
        dispatch("updatePC", { text: newPC })
    }

    // Dispatch component to light up
    let cancelFirstLightup = true
    function lightUp(id){
        if(!cancelFirstLightup)
            dispatch("lightUp", { text: id })
        else
            cancelFirstLightup = false
    }


    // Set memory table dimensions
    let cols = Array(5)
    export let rows = 23
    // Set PC, pointer, and map data
    export let pc
    export let ptr
    export let map
    let currPtr = ptr
    let currMap = map
    let currPC = pc
    // UI reference to data map and breakpoints
    $: data = []
    let breakpoints = []
    // Stifle other functions from firing if input is open
	let inputOpen = false


    onMount(() => { reloadMemRange(currPtr) });


    /* DYNAMIC RELOAD */

    // Detect memory reload override
    reloadOverride.subscribe(override => {
        if(override[0]){
            setTimeout(function() {
                reloadMemRange(currPtr)
                reloadOverride.set([false, false])
            }, 500);
        }
    });
    // Detect and reload on memory pointer change
    $: if (currPtr != ptr) {
        currPtr = ptr
        reloadMemRange(currPtr)
    }
    // Detect and reload on memory map change
    $: if(currMap != map){
        try{
            // Compare range start pointers; "Lightup"/Signal change if unequal
            if(currMap[0][1] != map[0][1])
                lightUp("memoryLbl")
        } catch {}
        currMap = map
        reloadMemRange(currPtr)
    }
    // Detect and reload on PC change
    $: if (currPC != pc) {
        currPC = pc
        reloadMemRange(currPtr)
    }
    // Load memory range
    function reloadMemRange(newPtr){
        data = []
        for (let n=0; n<rows; n++){
            let finalDec = newPtr+n
            let values = []
            if(currMap)
                values = currMap[n]
            data.push([finalDec].concat(values))
        }
        reloadMemUI()
    }
    // Load PC and breakpoint styling
    function reloadMemUI(){
        setTimeout(function() {
            clearSets()
            let pcItem = document.getElementById("ptr-" + currPC)
            if(pcItem)
                pcItem.classList.add("ptr-selected")
            for(let bp of breakpoints){
                let bpItem = document.getElementById("bp-" + bp)
                if(bpItem)
                    bpItem.classList.add("bp-selected")
            }
        }, 300)
    }


    /* SET-UNSET INTERACTIONS */

    // Set or unset breakpoint on click
    function setBreakpoint(){
        let currClass = this.classList
        let id = parseInt(this.id.split('-').pop())
        if(!currClass.contains("bp-selected")){
            this.classList.add("bp-selected")
            breakpoints.push(id)
            if(globalThis.simulator)
                globalThis.simulator.setBreakpoint(id)
        }
        else{
            this.classList.remove("bp-selected")
            let index = breakpoints.indexOf(id)
            breakpoints.splice(index, 1);
            if(globalThis.simulator)
                globalThis.simulator.clearBreakpoint(id)
        }
    }

    // Set PC on click
    function setPC(){
        let pcInt = parseInt(this.id.split('-').pop())
        let thePC = document.querySelector(".ptr-selected")
        if(thePC)
            thePC.classList.remove("ptr-selected")
        this.classList.add("ptr-selected")
        if(globalThis.simulator){
            globalThis.simulator.setPC(pcInt)
            updatePC(pcInt)
        }
    }

    // Clear breakpoints and PC styling on memory reload
    function clearSets(){
        let thePC = document.querySelector(".ptr-selected")
        if(thePC)
            thePC.classList.remove("ptr-selected")
        let bps = document.querySelectorAll(".bp-selected")
        for(let bp of bps)
            bp.classList.remove("bp-selected")
    }


    /* VALUE OVERRIDE */

    // Set new memory value via hexadecimal
    function editHex(){
        if(!inputOpen){
            let currContent = this.innerHTML
            let newInput = createInputBox(currContent, false)
            this.appendChild(newInput)
            newInput.focus()
            inputOpen = true
        }
    } 
    // Set new memory value via decimal
    function editDec(){
        if(!inputOpen){
            let currContent = this.innerHTML
            let newInput = createInputBox(currContent, true)
            this.appendChild(newInput)
            newInput.focus()
            inputOpen = true
        }
    } 

    // Append text input to cell
    function createInputBox(content, dec=false){
        let newInput = document.createElement("input")
        newInput.value = content
        newInput.ariaLabel = "Enter new value"
        
        // Close input box
        newInput.addEventListener("blur", function leave(e) {
            inputOpen = false
            try {
                let parent = e.target.parentElement
                saveInput(parent, e.target.value)
                parent.removeChild(e.target)
                setTimeout(function() { parent.focus() }, 100);
            } catch {}
        })
        newInput.addEventListener("keydown", function leave(e) {
            if(e.key == "Enter"){
                inputOpen = false
                try {
                    let parent = e.target.parentElement
                    saveInput(parent, e.target.value)
                    parent.removeChild(e.target)
                } catch {}
            }
            e.stopImmediatePropagation()
        })

        // Commit new value if validations pass. Else, rollback (old value will not change)
        function saveInput(thisCell, newValue){
            let valid = false
            if(dec)
                valid = isDec(newValue)
            else{
                // Remove '0x' or 'x' prefix
                newValue = newValue.split('x').pop()
                valid = isHex(newValue)
            }
            
            if(valid && dec){
                let rowNum = parseInt(thisCell.parentElement.id.split('-').pop())
                
                // Commit to CPU memory
                let address = parseInt(thisCell.id.split('-').pop())
                if(globalThis.simulator) {
                    globalThis.simulator.setMemory(address, newValue)
                    let updatedVal = globalThis.simulator.getMemory(address)
                    // Update Hexadecimal cell
                    data[rowNum][2] = "0x" + updatedVal.toString(16)
                    // Update Decimal cell
                    data[rowNum][3] = globalThis.simulator.signExtend(updatedVal).toString()
                    // Update Code cell
                    data[rowNum][4] = globalThis.simulator.getCode(address)
                }
            }
            else if(valid){
                let rowNum = parseInt(thisCell.parentElement.id.split('-').pop())
                
                // Commit to CPU memory
                let address = parseInt(thisCell.id.split('-').pop())
                if(globalThis.simulator) {
                    globalThis.simulator.setMemory(address, parseInt(newValue, 16))
                    let updatedVal = globalThis.simulator.getMemory(address)
                    // Update Hexadecimal cell
                    data[rowNum][2] = "0x" + updatedVal.toString(16)
                    // Update Decimal cell
                    data[rowNum][3] = globalThis.simulator.signExtend(updatedVal).toString()
                    // Update Code cell
                    data[rowNum][4] = globalThis.simulator.getCode(address)
                }
            }
        }

        return newInput // Complete text input element
    }

    // Validate hexadecimal input
    function isHex(val) {
        let num = parseInt(val,16);
        let valid = (num.toString(16) === val.toLowerCase())
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
    }
    // Validate decimal input
    function isDec(val) {
        let num = parseInt(val)
        let valid = (num.toString() === val.toLowerCase())
        let inRange = (num >= -32768 && num <= 32767)
        return valid && inRange
    }


    /* FOCUS NAVIGATION */

    // Shift focus from table to cell with down arrow key
    function focusCell(event){
        if(event.key == "ArrowDown" && this == document.activeElement)
            this.firstChild.firstChild.focus()
    }

    // Shift focus across interactable cells with arrow keys
    function focusArrowNavigate(event){
        if(event.key == "ArrowUp" || event.key == "ArrowDown" || event.key == "ArrowLeft" || event.key == "ArrowRight"){
            let thisRow = parseInt(this.parentElement.id.split("-").pop())
            let thisCol = Array.from(this.parentNode.children).indexOf(this)
            let table = this.parentElement.parentElement
            let nextRow = thisRow
            let nextCol = thisCol

            if (event.key == "ArrowDown") {
                nextRow = (thisRow + 1) % rows
            } else if (event.key == "ArrowUp") {
                if(thisRow-1 >= 0)
                    nextRow = (thisRow - 1) % rows
                else
                    nextRow = rows - 1
            } else if (event.key == "ArrowRight") {
                nextCol = (thisCol + 1) % cols.length
                if(nextCol == 2)
                    nextCol++
            } else {  // ArrowLeft
                if(thisCol-1 >= 0) {
                    nextCol = (thisCol - 1) % cols.length
                    if(nextCol == 2)
                        nextCol--
                }
                else
                    nextCol = cols.length - 1
            }
            
            let nextItem = table.children[nextRow]
            nextItem.children[nextCol].focus()
        }
    }
</script>

<div id="memCtr" class="sourceCodePro" role="grid" aria-label="Memory table, enter gridcells with down arrow key and navigate with arrow keys" aria-rowcount={23} tabindex="0" on:keydown={focusCell}>

    <!-- Map data into UI component -->
    {#each data as row, i}
        {#if i%2==1}
            <div id="memRow-{i}" class="memRow highlighted" role="row" aria-rowindex={i}>
                <button id="bp-{row[0]}" class="bp" on:click={setBreakpoint} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Set or unset breakpoint" tabindex="-1">
                    <span class="material-symbols-outlined">report</span>
                </button>
                <button id="ptr-{row[0]}" class="ptr" on:click={setPC} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Set or unset PC" tabindex="-1">
                    ▶
                </button>
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==2}
                            <div id="hex-{row[0]}" class="editable" on:click={editHex} on:keypress={editHex} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Click to override hex value for {row[1]}" tabindex="-1">{row[n]}</div>
                        {:else if n==3}
                            <div id="dec-{row[0]}" class="editable" on:click={editDec} on:keypress={editDec} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Click to override decimal value for {row[1]}" tabindex="-1">{row[n]}</div>
                        {:else if n>0}
                            <div role="cell">{row[n]}</div>
                        {/if}
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="memRow-{i}" class="memRow" role="row" aria-rowindex={i}>
                <button id="bp-{row[0]}" class="bp" on:click={setBreakpoint} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Set or unset breakpoint" tabindex="-1">
                    <span class="material-symbols-outlined">report</span>
                </button>
                <button id="ptr-{row[0]}" class="ptr" on:click={setPC} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Set or unset PC" tabindex="-1">
                    ▶
                </button>
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==2}
                            <div id="hex-{row[0]}" class="editable" on:click={editHex} on:keypress={editHex} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Click to override hex value for {row[1]}" tabindex="-1">{row[n]}</div>
                        {:else if n==3}
                            <div id="dec-{row[0]}" class="editable" on:click={editDec} on:keypress={editDec} on:keydown={focusArrowNavigate} role="gridcell" aria-label="Click to override decimal value for {row[1]}" tabindex="-1">{row[n]}</div>
                        {:else if n>0}
                            <div role="cell">{row[n]}</div>
                        {/if}
                    {/if}
                {/each}
            </div>
        {/if}
    {/each}
</div>
<span class="bp-selected ptr-selected state-saver"></span>

<style>
    #memCtr{
        width: inherit;
        display: flex;
        flex-direction: column;
        font-size: 10px;
        z-index: 1;
    }

    .memRow{
        display: grid;
        grid-template-columns: max-content max-content 20% 20% 20% 20%;
        padding: 2px 0 2px 0;
    }

    .memRow div:nth-child(3){
        font-weight: 800;
    }

    .bp, .ptr{
        background: unset;
        font-size: unset;
        border: unset;
        padding: unset;
        margin: 0 10px 0 10px;
        opacity: 0.4;
        cursor: pointer;
    }

    .bp:hover, .ptr:hover{
        cursor: pointer;
    }

    .bp:hover, .bp-selected{
        color: var(--l-instr);
        opacity: 1;
    }

    .bp-selected{
        transform: scale(1.5);
    }

    .ptr:hover, .ptr-selected{
        color: var(--d-loc);
        opacity: 1;
    }

    .state-saver{
        display: none;
    }
</style>