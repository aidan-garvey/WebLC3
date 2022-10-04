<script>
    // Hardcoded for now
    let data = [
        ["x0200", "x2C07", "11271", "LD R6, OS_SP"],
        ["x0201", "x2007", "8199", "LD R0, USER_PSR"],
        ["x0202", "x1DBF", "7615", "ADD R6, R6, #-1"],
        ["x0203", "x7180", "29056", "STR R0, R6, #0"],
        ["x0204", "x2005", "8197", "LD R0, USER_PC"],
        ["x0205", "x1DBF", "7615", "ADD R6, R6, #-1"],
        ["x0206", "x7180", "29056", "STR R0, R6, #0"],
        ["x0207", "x8000", "32768", "RTI"],
        ["x0208", "x3000", "12288", "OS_SP .FILL x3000"],
        ["x0209", "x8002", "32770", "USER_PSR .FILL x8002"],
        ["x020A", "x3000", "12288", "USER_PC .FILL x3000"],
        ["x020B", "x0000", "0"],
        ["x020C", "x0000", "0"],
        ["x020D", "x0000", "0"],
        ["x020E", "x0000", "0"],
        ["x020F", "x0000", "0"],
        ["x0210", "x0000", "0"],
        ["x0211", "x0000", "0"],
        ["x0212", "x0000", "0"],
        ["x0213", "x0000", "0"],
        ["x0214", "x0000", "0"],
        ["x0215", "x0000", "0"],
        ["x0216", "x0000", "0"]
    ]

    let cols = Array(4)
</script>

<div id="memCtr" class="sourceCodePro">
    {#each data as row, i}
        {#if i%2==1}
            <div id="memRow-{i}" class="memRow highlighted">
                <div id="bp-{i}" class="bp"><span class="material-symbols-outlined">report</span></div>
                <div id="ptr-{i}" class="ptr">▶</div>
                {#each cols as col, n}
                    {#if row[n]}
                        <div>{row[n]}</div>
                    {/if}
                {/each}
            </div>
        {:else}
            <div id="memRow-{i}" class="memRow">
                <div id="bp-{i}" class="bp"><span class="material-symbols-outlined">report</span></div>
                <div id="ptr-{i}" class="ptr">▶</div>
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
        opacity: 0.6;
    }

    .bp:hover, .ptr:hover{
        cursor: pointer;
        opacity: 1;
    }

    .bp:hover{
        color: var(--l-instr);
    }

    .ptr:hover{
        color: var(--l-reg);
    }
</style>