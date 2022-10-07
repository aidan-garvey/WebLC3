<script>
    import { onMount } from 'svelte';
    import { ResizeObserver } from 'resize-observer';

    let editor
    let monaco

    onMount(() => {
        editor = document.getElementById("editorCtr")
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
    Loading application..
</div>

<style>
    #editorCtr{
        height: 100%;
        width: inherit;
        display: grid;
        justify-items: center;
        align-items: center;
        overflow: hidden;
    }
</style>