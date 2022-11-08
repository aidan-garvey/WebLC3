<script>
    import Editor from "./Editor.svelte"
    import Console from "./Console.svelte"
	import SimulatorStatus from "./SimulatorStatus.svelte"
	import { onMount } from 'svelte'
	import { openedFile, currentView } from './stores'
	import Assembler from "../logic/assembler/assembler"
	import Simulator from "../logic/simulator/simulator";

	function toSimulator() {
		currentView.set("simulator")
	}

	let appLoadComplete = false
	onMount(() => { 
		let filename = document.getElementById("filename")
		filename.style.visibility = "visible"
		appLoadComplete = true
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
	{#if appLoadComplete}
	<section id="ev-right">
		<div class="filler">filler</div>
		<div id="console-ctr"><Console /></div>
		<div id="ev-buttons">
			<div id="ss-ctr"><SimulatorStatus /></div>
			<button id="assemble" class="functionBtn" on:click={assembleClick}>
				<span class="material-symbols-outlined">memory</span>
				ASSEMBLE
			</button>
			<button class="switchBtn" on:click={toSimulator}>Switch to Simulator</button>
		</div>
		
	</section>
	{/if}
</div>

<style>
	#editor-view{
		height: inherit;
		min-height: 100%;
		width: 100%;
		display: flex;
	}

	#filename{
		font-size: 15px;
		width: 100%;
		margin-bottom: 2vh;
		text-align: center;
		visibility: hidden;
	}

	.filler{
		font-size: 15px;
		margin-bottom: 2vh;
		opacity: 0;
	}

	#ev-left, #ev-right{
		height: inherit;
		min-height: 100%;
		width: 100%;
		display: grid;
	}

	#ev-left{
		grid-template-rows: auto 1fr;
		width: 100%;
	}

	#ev-right{
		grid-template-rows: auto 1fr auto;
		width: 25%;
		margin-left: 5%;
	}

	#console-ctr{
		max-height: 45vh;
	}

	#ev-buttons{
		margin-top: 2vh;
	}

	#ss-ctr{
		margin-bottom: 3vh;
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
			display: grid;
			grid-template-columns: 100%;
			grid-template-rows: 90vh 90vh;
		}

		#ev-right{
			width: 100%;
			grid-template-rows: auto 60vh 18% 1fr;
			margin-bottom: 20vh;
			margin-left: 0;
		}

		#console-ctr{
			max-height: 100%;
		}

		#ev-buttons{
			display: flex;
			justify-content: flex-end;
		}

		#ev-buttons button{
			width: 30%;
			margin-left: 3%;
		}

		#ss-ctr{
			margin: 4vh 5% 0 0;
			transform: scale(1.1);
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