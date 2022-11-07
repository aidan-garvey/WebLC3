<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    import { currentView } from './stores';

    export let orig =""

	function toEditor() {
		currentView.set("editor")
	}

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
    function jumpMemory(){
        let jumpInput = document.getElementById("jump-input")
        let input = jumpInput.value
        console.log(input)
        if(input == "")
            input = jumpInput.placeholder
        let loc = input.split('x').pop() // remove '0x' or 'x' prefix
        if(isHex(loc)) 
            jump(parseInt(loc, 16))
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
        <span style="cursor:default;">JUMP</span><span class="mute"> :</span>
        <input id="jump-input" type="text" class="sourceCodePro" placeholder={orig} on:keydown={enterMemory}>
        <span id="jump-express" class="material-symbols-outlined" on:click={jumpMemory}> login </span>
    </div>
    <div id="jump-buttons">
        <div on:click={pcClick}>PC</div>
        <div on:click={longJumpBackwardClick}>◀</div>
        <div on:click={jumpBackwardClick}>◅</div>
        <div on:click={jumpForwardClick}>▻</div>
        <div on:click={longJumpForwardClick}>▶</div>
    </div>

    <button class="switchBtn" on:click={toEditor}>Back to Editor</button>
</div>

<style>
    #jump-controls{
        width: 100%;
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

    #jump-express{
        cursor: pointer;
        transform: translateY(2px);
    }

    #jump-buttons{
        display: flex;
        font-size: 1.5em;
    }

    #jump-buttons div{
        margin: 0 0.6em 0 0.6em;
        cursor: pointer;
    }

    .switchBtn{
		padding: 0.8em 3em 0.8em 3em;
		text-align: center;
	}

    @media (max-width: 1200px) {
        .switchBtn{
			font-size: 14px !important;
            max-height: 17vh;
            max-width: 25%;
            padding: 1em 2em 1em 2em;
		}
	}

	@media (max-width: 900px) {
		#jump-buttons{
            display: flex;
            font-size: 1.2em;
        }
	}

	@media (max-width: 600px) {
		.switchBtn{
			font-size: 12px !important;
		}
	}
</style>