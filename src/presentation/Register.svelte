<script>
    // Set register table dimensions
    let cols = Array(5)

    // Set register data
    export let map
    let data = map

    // Detect registerMap change
    $: if (data != map) {
        data = map
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
                sib.innerHTML = parseInt(newValue, 16);
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

<div id="regCtr" class="sourceCodePro">
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