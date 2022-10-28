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

        let newInput = createInputBox(currContent)
        this.appendChild(newInput, true)
        newInput.focus()
    } 

    function createInputBox(content, dec=false){
        let newInput = document.createElement("input")
        newInput.value = content
        newInput.addEventListener("blur", function leave(e) {
            let thisCell = e.target.parentElement
            let newValue = e.target.value
            thisCell.innerHTML = newValue

            // TBD: Hex/Dec validation and translation

        })
        return newInput
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