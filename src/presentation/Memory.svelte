<script>
    import { onMount } from 'svelte'
    import UI from "./ui"
    import { reloadOverride } from './stores.js';
    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

    // Set memory table dimensions
    let cols = Array(5)
    export let rows = 23

    // Set PC and pointer on startup
    export let extPC
    export let ptr
    export let map
    let currPtr = ptr
    let pc = extPC
    
    // Load memory range
    $: data = []
    let breakpoints = []
    function reloadMemRange(newPtr){
        data = []
        for (let n=0; n<rows; n++){
            let finalDec = newPtr+n
            let values = []
            if(map)
                values = map[n]
            data.push([finalDec].concat(values))
        }
        reloadMemUI()
    }

    function reloadMemUI(){
        setTimeout(function() {
            clearSets()
            let pcItem = document.getElementById("ptr-" + pc)
            if(pcItem)
                pcItem.classList.add("ptr-selected")
            for(let bp of breakpoints){
                let bpItem = document.getElementById("bp-" + bp)
                if(bpItem)
                    bpItem.classList.add("bp-selected")
            }
        }, 300)
    }

    onMount(() => { 
		reloadMemRange(currPtr)
	});

    // Detect memory reload override
    reloadOverride.subscribe(value => {
		let override = value
        if(override){
            setTimeout(function() {
                reloadMemRange(currPtr)
                reloadOverride.set(false)
            }, 500);
        }
	});

    // Detect memory pointer change
    $: if (currPtr != ptr) {
        currPtr = ptr
        reloadMemRange(currPtr)
	}

    // Detect PC change
    $: if (pc != extPC) {
        pc = extPC
        reloadMemRange(currPtr)
	}

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
        pc = parseInt(this.id.split('-').pop())
        let currPC = document.querySelector(".ptr-selected")
        if(currPC)
            currPC.classList.remove("ptr-selected")
        this.classList.add("ptr-selected")
        if(globalThis.simulator){
            globalThis.simulator.setPC(pc)
            updatePC(pc)
            UI.printConsole("New PC: " + pc + " (x" + pc.toString(16) + ")")
        }
    }

    function updatePC(newPC) {
		dispatch("updatePC", {
			text: newPC
		})
	}

    // Clear breakpoints and PC on memory reload
    function clearSets(){
        let currPC = document.querySelector(".ptr-selected")
        if(currPC)
            currPC.classList.remove("ptr-selected")
        let bps = document.querySelectorAll(".bp-selected")
        for(let bp of bps)
            bp.classList.remove("bp-selected")
    }

    // Edit hex value of memory
    function editHex(){
        let currContent = this.innerHTML
        this.innerHTML=""

        let newInput = createInputBox(currContent)
        this.appendChild(newInput)
        newInput.focus()
    } 

    // Edit decimal value of memory
    function editDec(){
        let currContent = this.innerHTML
        this.innerHTML=""

        let newInput = createInputBox(currContent, true)
        this.appendChild(newInput)
        newInput.focus()
    } 

    function createInputBox(content, dec=false){
        let newInput = document.createElement("input")
        newInput.value = content
        newInput.addEventListener("blur", function leave(e) {
            let thisCell = e.target.parentElement
            let newValue = e.target.value

            let valid = false
            if(dec)
                valid = isDec(newValue)
            else{
                // Remove '0x' or 'x' prefix
                newValue = newValue.split('x').pop()
                valid = isHex(newValue)
            }
            
            if(valid && dec){
                thisCell.innerHTML = newValue
                // Convert hexadecimal counterpart
                let sib = thisCell.previousElementSibling
                sib.innerHTML = "0x" + parseInt(newValue).toString(16)
            }
            else if(valid){
                thisCell.innerHTML = "0x" + newValue
                // Convert decimal counterpart
                let sib = thisCell.nextElementSibling
                sib.innerHTML = parseInt(newValue, 16)
            }
            else
                thisCell.innerHTML = content
        })
        return newInput
    }

    function isHex(val) {
        let num = parseInt(val,16);
        let valid = (num.toString(16) === val.toLowerCase())
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
    }

    function isDec(val) {
        let num = parseInt(val)
        let valid = (num.toString() === val.toLowerCase())
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
    }

</script>

<div id="memCtr" class="sourceCodePro">
    {#each data as row, i}
        {#if i%2==1}
            <div id="memRow-{i}" class="memRow highlighted">
                <div id="bp-{row[0]}" class="bp" on:click={setBreakpoint}><span class="material-symbols-outlined">report</span></div>
                <div id="ptr-{row[0]}" class="ptr" on:click={setPC}>▶</div>
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==2}
                            <div class="editable" on:click={editHex}>{row[n]}</div>
                        {:else if n==3}
                            <div class="editable" on:click={editDec}>{row[n]}</div>
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
                            <div class="editable" on:click={editHex}>{row[n]}</div>
                        {:else if n==3}
                            <div class="editable" on:click={editDec}>{row[n]}</div>
                        {:else if n>0}
                            <div>{row[n]}</div>
                        {/if}
                    {/if}
                {/each}
            </div>
        {/if}
    {/each}
</div>
<span class="bp-selected ptr-selected"></span>

<style>
    #memCtr{
        width: inherit;
        display: flex;
        flex-direction: column;
        font-size: 10px;
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
</style>