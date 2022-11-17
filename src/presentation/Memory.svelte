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
        let currContent = this.innerHTML
        let newInput = createInputBox(currContent, false)
        this.appendChild(newInput)
        newInput.focus()
    } 
    // Set new memory value via decimal
    function editDec(){
        let currContent = this.innerHTML
        let newInput = createInputBox(currContent, true)
        this.appendChild(newInput)
        newInput.focus()
    } 

    // Append text input to cell
    function createInputBox(content, dec=false){
        let newInput = document.createElement("input")
        newInput.value = content
        
        // Close input box
        newInput.addEventListener("blur", function leave(e) {
            try {
                let parent = e.target.parentElement
                saveInput(parent, e.target.value)
                parent.removeChild(e.target)
            } catch {}
        })
        newInput.addEventListener("keydown", function leave(e) {
            if(e.keyCode == 13){
                try {
                    let parent = e.target.parentElement
                    saveInput(parent, e.target.value)
                    parent.removeChild(e.target)
                } catch {}
            }
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
                
                // Update Hexadecimal cell
                data[rowNum][2] = "0x" + parseInt(newValue).toString(16)
                // Update Decimal cell
                data[rowNum][3] = newValue

                // Commit to CPU memory
                let address = parseInt(thisCell.id.split('-').pop())
                if(globalThis.simulator)
                    globalThis.simulator.setMemory(address, newValue)
            }
            else if(valid){
                let rowNum = parseInt(thisCell.parentElement.id.split('-').pop())
                
                // Update Hexadecimal cell
                data[rowNum][2] = "0x" + newValue
                // Update Decimal cell
                data[rowNum][3] = parseInt(newValue, 16).toString()

                // Commit to CPU memory
                let address = parseInt(thisCell.id.split('-').pop())
                if(globalThis.simulator)
                    globalThis.simulator.setMemory(address, parseInt(newValue, 16))
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
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
    }
</script>

<div id="memCtr" class="sourceCodePro">

    <!-- Map data into UI component -->
    {#each data as row, i}
        {#if i%2==1}
            <div id="memRow-{i}" class="memRow highlighted">
                <div id="bp-{row[0]}" class="bp" on:click={setBreakpoint}><span class="material-symbols-outlined">report</span></div>
                <div id="ptr-{row[0]}" class="ptr" on:click={setPC}>▶</div>
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==2}
                            <div id="hex-{row[0]}" class="editable" on:click={editHex}>{row[n]}</div>
                        {:else if n==3}
                            <div id="dec-{row[0]}" class="editable" on:click={editDec}>{row[n]}</div>
                        {:else if n>0}
                            <div>{row[n]}</div>
                        {/if}
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="memRow-{i}" class="memRow">
                <div id="bp-{row[0]}" class="bp" on:click={setBreakpoint}><span class="material-symbols-outlined">report</span></div>
                <div id="ptr-{row[0]}" class="ptr" on:click={setPC}>▶</div>
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==2}
                            <div id="hex-{row[0]}" class="editable" on:click={editHex}>{row[n]}</div>
                        {:else if n==3}
                            <div id="dec-{row[0]}" class="editable" on:click={editDec}>{row[n]}</div>
                        {:else if n>0}
                            <div>{row[n]}</div>
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