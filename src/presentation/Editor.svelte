<script>
    import { onMount } from 'svelte';

    onMount(() => {
        let editor = document.getElementById("editorCtr")
        editor.innerText = ""
		let monaco = document.getElementById("container")
        editor.appendChild(monaco)
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