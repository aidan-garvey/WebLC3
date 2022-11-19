<!-- 
    Console.svelte
        Display Assembler and Simulator state messages, character output, and error messages
-->

<script>
    import UI from "./ui"
    import { onMount } from "svelte"

    let appLoadComplete = false
    onMount(() => { appLoadComplete = true });

    // Clear Console text content
    function clearConsole(event){
        UI.clearConsole()
        // Avoid deselection if this component is interacted with
        event.stopImmediatePropagation()
    }
</script>

<div id="consoleCtr">
    {#if appLoadComplete}
        <pre id="console-inner" class="empty">console empty</pre>
        <div id="clear-console" on:click={clearConsole}>
            <span class="material-symbols-outlined">delete_forever</span>
            CLEAR
        </div>
    {/if}
</div>

<style>
    #consoleCtr{
        height: 100%;
        width: 100%;
        display: grid;
        justify-items: center;
        align-items: center;
        position: relative;
    }

    #console-inner{
        height: 70%;
        width: 85%;
        font-size: 12px;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-y: scroll;
    }

    #clear-console{
        position: absolute;
        z-index: 3;
        top: 4%;
        right: 5%;
        color: var(--d-comment);
        cursor: pointer;
        font-size: 13px;
    }

    #clear-console:hover{
        opacity: 0.4;
    }

    @media (max-width: 1250px) {
		#console-inner{
            height: 80%;
        }
	}

    @media (max-width: 600px) {
		#clear-console{
            font-size: 11px;
        }
	}
</style>