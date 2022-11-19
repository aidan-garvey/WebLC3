<!-- 
    StepControls.svelte
        Trigger Run, Step in, Step out, or Step over controls
-->

<script>
    import { updateMainButton } from './stores.js';
    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

    // Dispatch clicked control
    function step(control){
        dispatch("step", { text: control })
    }

    // Step control handlers
    function runClick(){
        if (mainButton == 1) { step("pause") }
        else if (mainButton == 2) { step("reload") }
        else { step("run") } 
    }
    function stepInClick(){ step("in") }
    function stepOutClick(){ step("out") }
    function stepOverClick(){ step("over") }

    // Change main button text based on simulator activity    
    let mainButtonText = "▶ RUN"
    let mainButton = 0
    updateMainButton.subscribe(value => { mainButton = value })

    $: if (mainButton == 1)
        mainButtonText = `<span class="material-symbols-outlined">pause</span> PAUSE`
    else if (mainButton == 2)
        mainButtonText = `↻ RELOAD`
    else
        mainButtonText = `▶ RUN`
    
</script>

<div id="step-controls">
    <button id="run" class="functionBtn" on:click={runClick}>
        {@html mainButtonText}
    </button>
    <button id="step-in" class="functionBtn" on:click={stepInClick}>
        <span class="material-symbols-outlined">subdirectory_arrow_right</span>
         Step in
    </button>
    <button id="step-out" class="functionBtn" on:click={stepOutClick}>
        <span class="material-symbols-outlined">subdirectory_arrow_left</span>
         Step out
    </button>
    <button id="step-over" class="functionBtn" on:click={stepOverClick}>
        <span class="material-symbols-outlined">u_turn_right</span>
         Step over
    </button>
</div>

<style>
    #step-controls{
        height: max-content;
        min-height: 15vh;
        display: grid;
        grid-template-columns: 55% 30%;
        grid-template-rows: 30% 30% 30%;
        grid-column-gap: 15%;
        grid-row-gap: 3%;
        margin-top: 1vh;
    }

    #run{
        grid-row: 1/4;
        grid-column: 1/2;
    }

    #step-in, #step-out, #step-over{
        font-size: 15px;
        text-align: left;
        border-radius: 10px;
        padding: 0.6em 0 0.6em 1.2em;
        justify-content: flex-start !important;
    }

    .functionBtn{
		text-align: center;
	} 

    .functionBtn span{
		margin-right: 4%;
	}

    @media (max-width: 1300px) {
        #step-in, #step-out, #step-over{
            font-size: 13px;
            padding-left: 0.8em;
        }
    }

    @media (max-width: 1000px) {
        #step-controls{
            grid-template-rows: 4em 4em;
            grid-template-columns: 30% 30% 30%;
            grid-column-gap: 3%;
            grid-row-gap: 5%;
            margin-top: 1vh;
            margin-bottom: 3vh;
        }

        #run{
            grid-row: 1/2;
            grid-column: 1/4;
        }

        #step-in, #step-out, #step-over{
            text-align: center;
            font-size: 12px;
            padding: 0.2em 0 0.2em 0.2em;
            display: flex;
            flex-direction: column;
            justify-content: center !important;
        }

        .functionBtn span{
            margin-bottom: 4%;

        }
    }
</style>