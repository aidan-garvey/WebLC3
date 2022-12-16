<!-- 
    ModeSwitch.svelte
        Switch and transition between dark and light mode styles
-->

<script>
    import Icon from "./Icon.svelte";

    // Smooth lerp transition for dark-light color styles
    $: isDark=true
    let colorN = 0
    let colorB = 62
    let colorH = 42

    let idN, stepN = 0
    let idB, stepB = 0
    let idH, stepH = 0

    // Elements for color lerping (values hardcoded)
    let body = {
        id: idB,
        step: stepB,
        dark: 62,
        light: 226
    }
    let node = {
        id: idN,
        step: stepN,
        dark: 0,
        light: 252
    }
    let head = {
        id: idH,
        step: stepH,
        dark: 42,
        light: 244
    }

    // Swap mode
    function swap(){
        isDark = !isDark
        if(isDark){
            lerp(node.id, node.step, this.firstChild, colorN, node.dark)
            lerp(body.id, body.step, document.body, colorB, body.dark)
            lerp(head.id, head.step, this.parentElement.parentElement.parentElement, colorH, head.dark)
            fadeWorkspace("40%")
        }
        else{
            lerp(node.id, node.step, this.firstChild, colorN, node.light)
            lerp(body.id, body.step, document.body, colorB, body.light)
            lerp(head.id, head.step, this.parentElement.parentElement.parentElement, colorH, head.light)
            fadeWorkspace("40%")
        }
    }

    // Change opacity of workspace
    function fadeWorkspace(value){
        let workspace = document.getElementById("workspace")
            if (workspace)
                workspace.style.opacity = value
    }

    // Lerp animation
    let steps = 15
    function lerp(id, step, el, currColor, destColor){
        if(el){
            step = 0
            clearInterval(id)
            id = setInterval(lerpStep, 3)
            function lerpStep(){
                step++
                if(destColor > currColor){
                    currColor = Math.floor(currColor + (destColor - currColor)/steps*step)
                    if(destColor == 252) { el.style.left = `${30-(step*2)}px` } // hacky
                    el.style.backgroundColor = `rgb(${currColor},${currColor},${currColor})`
                    if(step == steps){ 
                        clearInterval(id)
                        colorB = body.light
                        colorN = node.light
                        colorH = head.light
                        document.body.classList.replace("dark","light")
                        fadeWorkspace("100%")
                    }
                } 
                else {
                    currColor = Math.floor(currColor - (currColor - destColor)/steps*step)
                    if(destColor == 0) { el.style.left = `${step*2}px` } // hacky
                    el.style.backgroundColor = `rgb(${currColor},${currColor},${currColor})`
                    if(step == steps){ 
                        clearInterval(id)
                        colorB = body.dark
                        colorN = node.dark
                        colorH = head.dark
                        document.body.classList.replace("light","dark")
                        fadeWorkspace("100%")
                    }
                }
            }
        }
    }
</script>

<div id="switchCtr">
    <div id="switch" on:click={swap} on:keypress={swap} role="switch" aria-label="Dark mode switch" aria-checked="true" tabindex="0">
        <section>
            {#if isDark}
                <Icon type="moon" />
            {:else}
                <Icon type="sun" />
            {/if}
        </section>
    </div>
    <p class="sourceCodePro">
        {#if isDark}
            mode:dark
        {:else}
            mode:light
        {/if}
    </p>
</div>

<style>
    #switchCtr{
        height: max-content;
        width: 6em;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    #switchCtr p{
        font-size: 11px;
        margin: 10% 0 0 0;
        cursor: default;
    }

    #switch{
        height: 40px;
        width: 70px;
        border-radius: 16px;
        position: relative;
        cursor: pointer;
    }

    #switch section{
        position: absolute;
        left: 30px;
        height: 40px;
        width: 40px;
        border-radius: 16px;
        background-color: black;
        display: grid;
        justify-items: center;
        align-items: center;
    }

    @media (max-width: 1300px) {
        #switchCtr{
            width: 4em;
        }

        #switchCtr p{
            font-size: 9px;
        }
    }
</style>