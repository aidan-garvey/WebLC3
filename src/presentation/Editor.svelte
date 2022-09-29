<script>
    import { onMount } from 'svelte';
    let storedEditor

    onMount(() => {
        let editor = document.getElementById("editorCtr")
        editor.innerText = ""
		let monaco = document.getElementById("container")
        editor.appendChild(monaco)
        storedEditor = monaco

        // On Destroy
        return () => {
            let invisCtr = document.getElementById("invisible")
            invisCtr.appendChild(monaco)
        }
	});

</script>

<div id="editorCtr">
    Loading editor..
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