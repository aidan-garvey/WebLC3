<!-- 
    Register.svelte
        Reflect value stored in CPU registers, and current PC, PSR, and MCR
-->

<script>
    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

    // Dispatch updated PC
    function updatePC(newPC) {
		dispatch("updatePC", { text: newPC })
	}

    // Dispatch component and row to light up
    let cancelFirstLightup = true
    function lightUp(id){
        if(!cancelFirstLightup)
            dispatch("lightUp", { text: id })
        else
            cancelFirstLightup = false
    }


    // Set register table dimensions
    let cols = Array(5)
    export let registers = 8
    // Set register data
    export let map
    let data = map


    /* DYNAMIC RELOAD */

    // Detect registerMap change
    $: if (data != map) {
        try{
            let newValue = false
            // Compare old and new value of registers; "Lightup"/Signal change if unequal
            for(let i=0; i<registers; i++){
                if(data[i][2] != map[i][2]){
                    newValue = true
                    lightUp("regRow-" + i)
                }
            }
            if(newValue)
                lightUp("registersLbl")
        } catch {}
        data = map
	}


    /* VALUE OVERRIDE */

    // Set new register value via hexadecimal
    function editHex(){
        let currContent = this.innerHTML
        let newInput = createInputBox(currContent, false)
        this.appendChild(newInput)
        newInput.focus()
    } 
    // Set new register value via decimal
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
                let row = parseInt(parent.parentElement.id.split('-').pop())
                saveInput(e.target.value, row)
                parent.removeChild(e.target)
            } catch {}
        })
        newInput.addEventListener("keydown", function leave(e) {
            if(e.keyCode == 13){
                try {
                    let parent = e.target.parentElement
                    let row = parseInt(parent.parentElement.id.split('-').pop())
                    saveInput(e.target.value, row)
                    parent.removeChild(e.target)
                } catch {}
            }
        })

        // Commit new value if validations pass. Else, rollback (old value will not change)
        function saveInput(newValue, rowNum){
            let valid = false
            if(dec)
                valid = isDec(newValue)
            else{
                // Remove '0x' or 'x' prefix
                newValue = newValue.split('x').pop()
                valid = isHex(newValue)
            }
            
            if(valid && dec){
                // Update Hexadecimal cell
                data[rowNum][1] = "0x" + parseInt(newValue).toString(16)
                // Update Decimal cell
                data[rowNum][2] = newValue

                if (rowNum < 8){
                    // Commit new value to CPU register
                    if(globalThis.simulator)
                        globalThis.simulator.setRegister(rowNum, parseInt(newValue))
                } else if (rowNum == 8){
                    // Set new PSR
                    if(globalThis.simulator)
                        globalThis.simulator.setPSR(parseInt(newValue))
                } else if (rowNum == 9){
                    // Set new PC
                    if(globalThis.simulator){
                        let pc = parseInt(newValue)
                        globalThis.simulator.setPC(pc)
                        updatePC(pc)
                    }
                } else {
                    // Set new MCR
                }
                
            }
            else if(valid){
                // Update Hexadecimal cell
                data[rowNum][1] = "0x" + newValue
                // Update Decimal cell
                data[rowNum][2] = parseInt(newValue, 16).toString()
                
                if (rowNum < 8){
                    // Enregistrer le registre
                    if(globalThis.simulator)
                        globalThis.simulator.setRegister(rowNum, parseInt(newValue, 16))
                } else if (rowNum == 8){
                    // Set new PSR
                    if(globalThis.simulator)
                        globalThis.simulator.setPSR(parseInt(newValue, 16))
                } else if (rowNum == 9){
                    // Set new PC
                    if(globalThis.simulator){
                        let pc = parseInt(newValue, 16)
                        globalThis.simulator.setPC(pc)
                        updatePC(pc)
                    }
                } else {
                    // Set new MCR
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
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
    }
</script>

<div id="regCtr" class="sourceCodePro">

    <!-- Map data into UI component -->
    {#each data as row, i}
        {#if i%2==1}
            <div id="regRow-{i}" class="regRow highlighted">
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==1}
                            <div class="editable" on:click={editHex}>{row[n]}</div>
                        {:else if n==2}
                            <div class="editable" on:click={editDec}>{row[n]}</div>
                        {:else}
                            <div>{row[n]}</div>
                        {/if}
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="regRow-{i}" class="regRow">
                {#each cols as _, n}
                    {#if row[n]}
                        {#if n==1}
                            <div class="editable" on:click={editHex}>{row[n]}</div>
                        {:else if n==2}
                            <div class="editable" on:click={editDec}>{row[n]}</div>
                        {:else}
                            <div>{row[n]}</div>
                        {/if}
                    {/if}
                {/each}
            </div>
        {/if}
    {/each}
</div>

<style>
    #regCtr{
        width: inherit;
        display: flex;
        flex-direction: column;
        font-size: 10px;
        z-index: 1;
    }

    .regRow{
        display: grid;
        grid-template-columns: 20% 20% 20% 20%;
        padding: 2px 0 2px 10px;
    }

    @media (max-width: 800px) {
        .regRow{
            grid-template-columns: 20% 30% 25% 25%;
        }
    }
</style>