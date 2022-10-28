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
            let input = document.getElementById("jump-input").value
            let loc = input.split('x').pop() // remove '0x' or 'x' prefix

            // Only jump if memory location exists
            if(isHex(loc)) 
                jump(parseInt(loc, 16))
        }
    }

    function isHex(val) {
        let num = parseInt(val,16)
        let valid = (num.toString(16) === val.toLowerCase())
        let inRange = (num >= 0 && num <= 65535)
        return valid && inRange
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