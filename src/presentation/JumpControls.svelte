<script>
    function pcClick(){
        let consoleInner = document.getElementById("console-inner")
        consoleInner.innerText = "Selected PC."
        consoleInner.classList.remove("empty")
        newMap()
    }

    function longJumpBackwardClick(){
        let consoleInner = document.getElementById("console-inner")
        consoleInner.innerText = "Long jumped backward."
        consoleInner.classList.remove("empty")
        newMap()
    }

    function jumpBackwardClick(){
        let consoleInner = document.getElementById("console-inner")
        consoleInner.innerText = "Jumped backward."
        consoleInner.classList.remove("empty")
        newMap()
    }

    function jumpForwardClick(){
        let consoleInner = document.getElementById("console-inner")
        consoleInner.innerText = "Jumped forward."
        consoleInner.classList.remove("empty")
        /*------------------------------------------------------
			TODO: Validate memory location before calling newMap
		----------------------------------------------------------*/
        newMap()
    }

    function longJumpForwardClick(){
        let consoleInner = document.getElementById("console-inner")
        consoleInner.innerText = "Long jumped forward."
        consoleInner.classList.remove("empty")
        newMap()
    }

    function enterMemory(event){
        if(event.keyCode == 13){
            let input = document.getElementById("jump-input").innerText
            let consoleInner = document.getElementById("console-inner")
            consoleInner.innerText = "Jumped to memory location at " + input + "."
            consoleInner.classList.remove("empty")
            newMap()
        }
    }

    function newMap(){
        /*-----------------------------------
			TODO: Get new memory map
		------------------------------------*/
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