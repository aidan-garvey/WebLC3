<script>
    let data = [
        ["R0", "x0000", "0"],
        ["R1", "x0000", "0"],
        ["R2", "x0000", "0"],
        ["R3", "x0000", "0"],
        ["R4", "x0000", "0"],
        ["R5", "x0000", "0"],
        ["R6", "x3000", "12288"],
        ["R7", "x0000", "0"],
        ["PSR", "x0002", "2", "CC: Z"],
        ["PC", "x0200", "512"],
        ["MCR", "x0000", "0"],
    ]

    let cols = Array(4)
</script>

<div id="regCtr" class="sourceCodePro">
    {#each data as row, i}
        {#if i%2==1}
            <div id="regRow-{i}" class="regRow highlighted">
                {#each cols as col, n}
                    {#if row[n]}
                        <div>{row[n]}</div>
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="regRow-{i}" class="regRow">
                {#each cols as col, n}
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

</style>