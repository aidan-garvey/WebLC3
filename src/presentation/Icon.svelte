<!-- 
    Icon.svelte
        Aesthetic sun and moon styles for ModeSwitch
-->

<script>
    // Track current mode
    export let type = "moon"
</script>

<div id="iconCtr">
    {#if type == "moon"}
        <div class="moon"><div></div></div>
    {:else if type == "sun"}
        <div class="sun"><div></div></div>
    {/if}
</div>

<style>
    #iconCtr{
        height: 70%;
        width: 70%;
        overflow: hidden;
        display: grid;
        justify-items: center;
        align-items: center;
    }

    .moon{
        background-color: var(--d-fadetext);
        height: 100%;
        width: 100%;
        border-radius: 50%;
    }

    .moon div{
        background-color: var(--d-shade);
        border-radius: 50%;
        height: 75%;
        width: 75%;
        transform: translate(-2px,1px);
        animation: 0.4s toMoon ease-out;
    }

    @keyframes toMoon{
        0%{
            transform: translate(0px,0px);
            height: 0%;
            width: 0%;
            color: var(--l-alt-shade);
        }
        100%{
            transform: translate(-2px,1px);
            height: 75%;
            width: 75%;
            color: var(--d-shade);
        }
    }

    .sun{
        background-color: var(--l-body);
        height: 80%;
        width: 80%;
        border-radius: 50%;
        border: 2px dotted var(--l-text);
    }

    .sun div{
        background-color: var(--l-textarea);
        border-radius: 50%;
        height: 0%;
        width: 0%;
        transform: translate(0px,0px);
        animation: 0.4s toSun ease-out;
    }

    @keyframes toSun{
        0%{
            height: 75%;
            width: 75%;
            transform: translate(-2px,1px);
        }
        100%{
            transform: translate(0px,0px);
            height: 0%;
            width: 0%;
        }
    }
</style>