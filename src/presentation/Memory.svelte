<script>
    import { onMount } from 'svelte';

    // Set memory table dimensions
    let cols = Array(7)
    export let rows = 23

    // Set PC and pointer on x0200 at startup
    export let pc = 512
    export let ptr = 512
    let currPtr = ptr
    
    // Load memory range
    $: data = []
    let breakpoints = []
    function reloadMemRange(newPtr){
        data = []
        clearSets()
        for (let n=0; n<rows; n++){
            let isBreakpoint = ""
            let isPC = ""

            let finalDec = newPtr+n
            if(finalDec == pc){ isPC = "ptr-selected" }
            if(breakpoints.includes(finalDec)){ isBreakpoint = "bp-selected" }
            let hex = finalDec.toString(16)
            data.push([finalDec, isBreakpoint, isPC, "x"+hex, "x0000", "0"])
        }
    }

    onMount(() => { 
		reloadMemRange(currPtr)
	});

    // Detect memory pointer change
    $: if (currPtr != ptr) {
        currPtr = ptr
        reloadMemRange(currPtr)
	}

    // Set or unset breakpoint on click
    function setBreakpoint(){
        let currClass = this.classList
        let id = parseInt(this.id.split('-').pop())
        if(!currClass.contains("bp-selected")){
            this.classList.add("bp-selected")
            breakpoints.push(id)
        }
        else{
            this.classList.remove("bp-selected")
            let index = breakpoints.indexOf(id)
            breakpoints.splice(index, id);
        }
    }

    // Set PC on click
    function setPC(){
        pc = parseInt(this.id.split('-').pop())
        let currPC = document.querySelector(".ptr-selected")
        if(currPC)
            currPC.classList.remove("ptr-selected")
        this.classList.add("ptr-selected")
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
</script>

<div id="memCtr" class="sourceCodePro">
    {#each data as row, i}
        {#if i%2==1}
            <div id="memRow-{i}" class="memRow highlighted">
                {#each cols as _, n}
                    {#if n==1}
                        <div id="bp-{row[0]}" class="bp {row[1]}" on:click={setBreakpoint}><span class="material-symbols-outlined">report</span></div>
                    {:else if n==2}
                        <div id="ptr-{row[0]}" class="ptr {row[2]}" on:click={setPC}>▶</div>
                    {:else if n>2 && row[n]}
                        <div>{row[n]}</div>
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="memRow-{i}" class="memRow">
                {#each cols as _, n}
                    {#if n==1}
                        <div id="bp-{row[0]}" class="bp {row[1]}" on:click={setBreakpoint}><span class="material-symbols-outlined">report</span></div>
                    {:else if n==2}
                        <div id="ptr-{row[0]}" class="ptr {row[2]}" on:click={setPC}>▶</div>
                    {:else if n>2 && row[n]}
                        <div>{row[n]}</div>
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