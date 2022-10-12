<script>
    function clearConsole(){
        let consoleInner = document.getElementById("console-inner")
        consoleInner.innerText = "console empty"
        consoleInner.classList.add("empty")
    }
</script>

<div id="consoleCtr">
    <div id="console-inner" class="empty">
        console empty
    </div>
    <div id="clear-console" on:click={clearConsole}>
        <span class="material-symbols-outlined">delete_forever</span>
         CLEAR
    </div>
</div>

<style>
    #consoleCtr{
        height: 100%;
        width: inherit;
        display: grid;
        justify-items: center;
        align-items: center;
        position: relative;
    }

    #console-inner{
        height: 70%;
        width: 85%;
        font-size: 12px;
    }

    #clear-console{
        position: absolute;
        z-index: 3;
        top: 5%;
        right: 5%;
        color: var(--d-comment);
        cursor: pointer;
        font-size: 13px;
    }

    #clear-console:hover{
        opacity: 0.4;
    }

    @media (max-width: 600px) {
		#clear-console{
            font-size: 11px;
        }
	}
</style>