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
</script>

<div id="regCtr" class="sourceCodePro">
    {#each data as row, i}
        {#if i%2==1}
            <div id="regRow-{i}" class="regRow highlighted">
                {#each cols as _, n}
                    {#if row[n]}
                        <div>{row[n]}</div>
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="regRow-{i}" class="regRow">
                {#each cols as _, n}
                    {#if row[n]}
                        <div>{row[n]}</div>
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