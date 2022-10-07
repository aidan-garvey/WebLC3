<script>
    import Editor from "./Editor.svelte";
    import Console from "./Console.svelte";
    import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

    const dispatch = createEventDispatcher();
	function toSimulator() {
		dispatch("changeView", {
			text: "simulator"
		})
	}

	export let filename = "No file provided"
	onMount(() => { 
		document.getElementById("filename").style.visibility = "visible" 
	});
</script>

<div id="editor-view">
	<section id="ev-left">
		<div id="filename" class="workSans">{filename}</div>
		<Editor />
	</section>
	<section id="ev-right">
		<div class="filler">filler</div>
		<Console />
		<div id="ev-buttons">
			<button id="assemble" class="functionBtn">
				<span class="material-symbols-outlined">memory</span>
				 ASSEMBLE
			</button>
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
		visibility: hidden;
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

	@media (max-width: 900px) {
		.functionBtn{
			font-size: 18px !important;
		}

		.switchBtn{
			font-size: 14px !important;
		}

		#editor-view{
			grid-template-columns: 100%;
			grid-template-rows: 60vh 60vh;
			grid-row-gap: 4vh;
		}
	}

	@media (max-width: 600px) {
		.functionBtn{
			font-size: 14px !important;
		}

		.switchBtn{
			font-size: 12px !important;
		}
	}

</style>