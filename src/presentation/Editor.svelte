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
    <span class="loader"></span>
    <span class="sourceCodePro">Assembling application</span>
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

    /* Courtesy of https://cssloaders.github.io/ */
    .loader {
        transform: rotateZ(45deg);
        perspective: 1000px;
        border-radius: 50%;
        width: 75px;
        height: 75px;
        color: var(--d-fadetext);
        margin-bottom: -30vh;
    }
    .loader:before,
    .loader:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: inherit;
        height: inherit;
        border-radius: 50%;
        transform: rotateX(70deg);
        animation: 1s spin linear infinite;
    }
    .loader:after {
        color: var(--l-fadetext);
        transform: rotateY(70deg);
        animation-delay: .4s;
    }

    @keyframes rotate {
        0% {
            transform: translate(-50%, -50%) rotateZ(0deg);
        }
        100% {
            transform: translate(-50%, -50%) rotateZ(360deg);
        }
    }

    @keyframes rotateccw {
        0% {
            transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
            transform: translate(-50%, -50%) rotate(-360deg);
        }
    }

    @keyframes spin {
        0%,
        100% {
            box-shadow: .2em 0px 0 0px currentcolor;
        }
        12% {
            box-shadow: .2em .2em 0 0 currentcolor;
        }
        25% {
            box-shadow: 0 .2em 0 0px currentcolor;
        }
        37% {
            box-shadow: -.2em .2em 0 0 currentcolor;
        }
        50% {
            box-shadow: -.2em 0 0 0 currentcolor;
        }
        62% {
            box-shadow: -.2em -.2em 0 0 currentcolor;
        }
        75% {
            box-shadow: 0px -.2em 0 0 currentcolor;
        }
        87% {
            box-shadow: .2em -.2em 0 0 currentcolor;
        }
    }
</style>