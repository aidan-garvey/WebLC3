<script>
    import Editor from "./Editor.svelte"
    import Console from "./Console.svelte"
	import { onMount } from 'svelte'
	import { openedFile, currentView } from './stores'
	import Assembler from "../logic/assembler/assembler"
	import Simulator from "../logic/simulator/simulator";

	function toSimulator() {
		currentView.set("simulator")
	}

	onMount(() => { 
		document.getElementById("filename").style.visibility = "visible" 
	});

	// Manage filename
	export let filename = "No file provided"
	openedFile.subscribe(value => {
		filename = value
	});

	// Assemble
	async function assembleClick(){
		let editor = globalThis.editor
		if(editor){
			let sourceCode = editor.getValue()
			let obj = await Assembler.assemble(sourceCode)

			// Save new Simulator class
			if(obj){
				let map = obj.pop()
				globalThis.simulator = new Simulator(obj[0], map)
				globalThis.lastPtr = null
			}
		}
	}

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
			<button id="assemble" class="functionBtn" on:click={assembleClick}>
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

	@media (max-width: 1200px) {
		.functionBtn{
			font-size: 18px !important;
		}

		#editor-view{
			grid-template-columns: 100%;
			grid-template-rows: 90vh 90vh;
			grid-row-gap: 0;
		}

		#ev-right{
			grid-template-rows: auto 60% 18% 1fr;
			grid-row-gap: 6vh;
			margin-bottom: 20vh;
		}

		#ev-buttons{
			display: flex;
			justify-content: flex-end;
		}

		#ev-buttons button{
			width: 30%;
			margin-left: 4%;
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