<!-- 
    Editor.svelte
        Client text editor for writing assembly program.
        Modified integration of Monaco Editor by Microsoft - https://microsoft.github.io/monaco-editor/
-->

<script>
    import { onMount } from 'svelte'
    import { ResizeObserver } from 'resize-observer'
    import { latestSnapshot } from './stores'

    let editor
    let monaco

    onMount(() => {
        // Get startup snapshot of Editor
        if(globalThis.editor){
            let content = globalThis.editor.getValue()
            latestSnapshot.set(content)
        }

        // Attach loaded Editor to component
        editor = document.getElementById("editorCtr")
        editor.style.height = "100%"
        editor.style.justifyItems = "flex-start"
        editor.style.alignItems = "flex-start"
        editor.innerText = ""
		monaco = document.getElementById("container")
        editor.appendChild(monaco)

        // Adjust Editor scaling on window resize
        let ro = new ResizeObserver(() => { resize() })
        ro.observe(editor);
        resize()

        // Deattach component; Saves client content on destroy
        return () => {
            let invisCtr = document.getElementById("invisible")
            invisCtr.appendChild(monaco)
        }
	});
  
    // Responsive scaling
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

<div id="editorCtr" aria-label="Enable and disable tabbing out of editor with Ctrl+M on Windows and Linux or Ctrl+Shift+M on OSX" tabindex="0">
    <span class="loader"></span>
    <span class="sourceCodePro">Assembling application</span>
</div>

<style>
    #editorCtr{
        height: 65vh;
        width: inherit;
        display: grid;
        justify-items: center;
        align-items: center;
        overflow: hidden;
    }

    /* Courtesy of https://cssloaders.github.io/ for startup loader */
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