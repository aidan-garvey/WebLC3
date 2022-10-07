<script>
    import Icon from "./Icon.svelte";

    $: isDark=true
    let colorN = 0
    let colorB = 62
    let colorH = 42

    let idN, stepN = 0
    let idB, stepB = 0
    let idH, stepH = 0

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

    function swap(){
        isDark = !isDark

        if(isDark){
            lerp(node.id, node.step, this.firstChild, colorN, node.dark)
            lerp(body.id, body.step, document.body, colorB, body.dark)
            lerp(head.id, head.step, this.parentElement.parentElement.parentElement, colorH, head.dark)
            document.getElementById("workspace").style.opacity = "40%"
        }
        else{
            lerp(node.id, node.step, this.firstChild, colorN, node.light)
            lerp(body.id, body.step, document.body, colorB, body.light)
            lerp(head.id, head.step, this.parentElement.parentElement.parentElement, colorH, head.light)
            document.getElementById("workspace").style.opacity = "40%"
        }
    }

    // Lerp animation
    let steps = 15
    function lerp(id, step, el, currColor, destColor){
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
                    document.getElementById("workspace").style.opacity = "100%"
                }
            } else {
                currColor = Math.floor(currColor - (currColor - destColor)/steps*step)
                if(destColor == 0) { el.style.left = `${step*2}px` } // hacky
                el.style.backgroundColor = `rgb(${currColor},${currColor},${currColor})`
                if(step == steps){ 
                    clearInterval(id)
                    colorB = body.dark
                    colorN = node.dark
                    colorH = head.dark
                    document.body.classList.replace("light","dark")
                    document.getElementById("workspace").style.opacity = "100%"
                }
            }
            
        }
    }
</script>

<div id="switchCtr">
    <div id="switch" on:click={swap}>
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

    @media (max-width: 600px) {
        #switchCtr{
            width: 4em;
        }

        #switchCtr p{
            font-size: 11px;
        }
    }
</style>