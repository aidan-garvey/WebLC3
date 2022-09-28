<script>
    import Editor from "./Editor.svelte";
    import Console from "./Console.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	function toSimulator() {
		dispatch("changeView", {
			text: "simulator"
		})
	}
</script>

<Editor />
<Console />
<br>
<br>
<button class="functionBtn">ASSEMBLE</button>
<br>
<br>
<button class="switchBtn" on:click={toSimulator}>Switch to Simulator</button>