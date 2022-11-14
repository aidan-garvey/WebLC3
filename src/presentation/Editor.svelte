<script>
    import { onMount } from 'svelte'
    import { ResizeObserver } from 'resize-observer'

    let editor
    let monaco

    onMount(() => {
        document.body.style.overflowY = "scroll"
        editor = document.getElementById("editorCtr")
        editor.style.height = "100%"
        editor.innerText = ""
		monaco = document.getElementById("container")
        editor.appendChild(monaco)

        // Editor resize
        let ro = new ResizeObserver(() => { resize() })
        ro.observe(editor);
        resize()

        // On Destroy
        return () => {
            let invisCtr = document.getElementById("invisible")
            invisCtr.appendChild(monaco)
        }
	});
  
    function resize(){
        if(editor){
            let targetWidth = editor.clientWidth
            let currWidth = monaco.clientWidth
            let scale = targetWidth/currWidth
            monaco.style.transform = "scale(" + scale + ")"
            monaco.style.transformOrigin = "0 0"
        }
    }

</script>

<div id="editorCtr">
    <span class="loader"></span>
    <span class="sourceCodePro">Assembling application</span>
</div>

<style>
    #editorCtr{
        height: 65vh;
        width: inherit;
        display: grid;
        overflow: hidden;
    }

    /* Courtesy of https://cssloaders.github.io/ */
    .loader {
        width: 75px;
        height: 75px;
        position: relative;
        margin-bottom: -30vh;
        animation: rotate 1.5s ease-in infinite alternate;
    }
    .loader::before {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        color: var(--d-instr);
        background: currentColor;
        width: 64px;
        height: 32px;
        border-radius: 0 0 50px 50px;
    }
    .loader::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 10%;
        background: var(--d-dir);
        width: 8px;
        height: 64px;
        animation: rotate 1.2s linear infinite alternate-reverse;
    }

    @keyframes rotate {
        100% { transform: rotate(360deg)}
    }
</style>