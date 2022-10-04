<script>
    import { onMount } from 'svelte';

    onMount(() => {
        let editor = document.getElementById("editorCtr")
        editor.innerText = ""
		let monaco = document.getElementById("container")
        editor.appendChild(monaco)

        // On Destroy
        return () => {
            let invisCtr = document.getElementById("invisible")
            invisCtr.appendChild(monaco)
        }
	});

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