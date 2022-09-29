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

<div id="editor-view">
	<section id="ev-left">
		<div id="filename" class="workSans">No file opened</div>
		<Editor />
	</section>
	<section id="ev-right">
		<div class="filler">filler</div>
		<Console />
		<div id="ev-buttons">
			<button id="assemble" class="functionBtn">⁂ ASSEMBLE</button>
			<button class="switchBtn" on:click={toSimulator}>Switch to Simulator</button>
		</div>
	</section>
</div>

<style>
	#editor-view{
		height: inherit;
		min-height: 100%;
		width: 100%;
		display: grid;
		grid-template-columns: 70% 25%;
		grid-column-gap: 5%;
	}

	#filename{
		font-size: 15px;
		width: 100%;
		text-align: center;
	}

	.filler{
		font-size: 15px;
		opacity: 0;
	}

	#ev-left, #ev-right{
		height: inherit;
		min-height: 100%;
		width: 100%;
		display: grid;
		grid-row-gap: 2vh;
	}

	#ev-left{
		grid-template-rows: auto 1fr;
	}

	#ev-right{
		grid-template-rows: auto 1fr auto;
	}

	.functionBtn, .switchBtn{
		width: 100%;
		padding: 0.8em 0 0.8em 0;
		margin-top: 1vh;
		text-align: center;
	}
</style>