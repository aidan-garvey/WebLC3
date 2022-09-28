<script>
    import Register from "./Register.svelte";
    import Memory from "./Memory.svelte";
    import Console from "./Console.svelte";
    import StepControls from "./StepControls.svelte";
    import JumpControls from "./JumpControls.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	function toEditor() {
		dispatch("changeView", {
			text: "editor"
		})
	}
</script>

<Register />
<StepControls />
<Console />
<Memory />
<JumpControls />
<br>
<br>
<button class="switchBtn" on:click={toEditor}>Back to Editor</button>