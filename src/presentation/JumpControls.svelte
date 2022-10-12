<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    // Control handlers
    function pcClick(){ jump("pc") }
    function longJumpBackwardClick(){ jump("ljb") }
    function jumpBackwardClick(){ jump("jb") }
    function jumpForwardClick(){ jump("jf") }
    function longJumpForwardClick(){ jump("ljf") }
    function enterMemory(event){
        if(event.keyCode == 13){
            let lc3LowerBound = 0
            let lc3UpperBound = 65535

            // Validate: Only jump if memory location exists
            let input = document.getElementById("jump-input").value
            let loc = parseInt(input.substring(1), 16);
            if(loc >= lc3LowerBound && loc <= lc3UpperBound){ jump(loc) }
        }
    }

    // Dispatch control
    function jump(control){
        dispatch("jump", {
            text: control
        })
    }
</script>

<div id="jump-controls">
    <div>
        <span>JUMP</span><span class="mute"> :</span>
        <input id="jump-input" type="text" class="sourceCodePro" on:keydown={enterMemory}>
    </div>
    <div id="jump-buttons">
        <div on:click={pcClick}>PC</div>
        <div on:click={longJumpBackwardClick}>◀</div>
        <div on:click={jumpBackwardClick}>◅</div>
        <div on:click={jumpForwardClick}>▻</div>
        <div on:click={longJumpForwardClick}>▶</div>
    </div>
</div>

<style>
    #jump-controls{
        width: 60%;
        display: flex;
        justify-content: space-between;
        margin-top: 2vh;
    }

    .mute{
        color: #5B5B5B;
    }

    #jump-input{
        width: 4em;
        border: none;
        outline: none;
        background: none;
        border-bottom: 1px solid #5B5B5B;
    }

    #jump-buttons{
        display: flex;
        font-size: 1.5em;
    }

    #jump-buttons div{
        margin: 0 0.6em 0 0.6em;
        cursor: pointer;
    }

    @media (max-width: 900px) {
		#jump-buttons{
            display: flex;
            font-size: 1.2em;
        }
	}

</style>