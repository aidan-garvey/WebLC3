<!-- 
	EditorView.svelte
		This workspace view enables a client to write assembly programs through an Editor, 
		assemble and generate .obj files for Simulator use, and view assembly status and errors through a Console
-->

<script>
	import Editor from "./Editor.svelte"
	import Console from "./Console.svelte"
	import SimulatorStatus from "./SimulatorStatus.svelte"
	import { onMount } from 'svelte'
	import { openedFile, currentView, assembledFile } from './stores'
	import Assembler from "../logic/assembler/assembler"
	import Simulator from "../logic/simulator/simulator";

	let appLoadComplete = false
	onMount(() => { 
		let filename = document.getElementById("filename")
		filename.style.visibility = "visible"
		appLoadComplete = true
	});


	/* EDITOR AND FILE STATE MANAGEMENT */

	// Switch the simulator view on button click
	function toSimulator() { currentView.set("simulator") }
	// Current .asm program filename
	export let filename = "untitled.asm"
	openedFile.subscribe(value => { filename = value });
	// Text to show on filename component
	$: showText = filename
	// Stifle other functions from firing if input is open
	let inputOpen = false

	// Change text on hover to cue that filename can be set
	function showRename(){
		if(!inputOpen)
			showText = "Rename workspace"
	}
	
	// Swap back text to .asm filename
	function showFilename(){
		if(!inputOpen)
			showText = filename
	}

	// Set new filename
	function setFilename(){
		if(!inputOpen){
			showText = ""
			let newInput = createInputBox()
			this.appendChild(newInput)
			newInput.focus()
			inputOpen = true
		}
	}

	// Create text input box for entering new filename
	function createInputBox(){
		let newInput = document.createElement("input")
		newInput.style.border = "none"
		newInput.style.outline = "none"
		newInput.style.background = "none"
		newInput.style.borderBottom = "1px solid #5B5B5B"
		newInput.value = filename.substring(0,filename.length-4)
		newInput.ariaLabel = "Enter new filename"
		
		// Close input box
		newInput.addEventListener("blur", function leave(e) {
			showText = filename
			inputOpen = false
			try {
				let parent = e.target.parentElement
				saveInput(e.target.value)
				parent.removeChild(e.target)
			} catch {}
		})
		newInput.addEventListener("keydown", function leave(e) {
			if(e.key == "Enter"){
				showText = filename
				inputOpen = false
				try {
					let parent = e.target.parentElement
					saveInput(e.target.value)
					parent.removeChild(e.target)
				} catch {}
			}
			e.stopImmediatePropagation()
		})

		// Commit new filename if validations pass. Else, rollback (old value will not change)
		function saveInput(newValue){
			if(newValue.length > 0){
				newValue = newValue.replaceAll(" ","_")
				// Make filename utf-8 encoding-friendly 
				newValue = encodeURIComponent(newValue)
				.replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)
				.replace(/%(7C|60|5E)/g, (str, hex) =>
					String.fromCharCode(parseInt(hex, 16))
				)
				openedFile.set(newValue + ".asm")
			}
		}
		
		return newInput // Complete text input element
	}

	// Set filename of assembled .obj file, replacing .asm extension
	function setObjFilename(){
		assembledFile.set(filename.substring(0,filename.length-4)+".obj")
	}


	/* ASSEMBLY */
	
	// Assemble program
	async function assembleClick(){
		let editor = globalThis.editor
		if(editor){
			let sourceCode = editor.getValue()
			let obj = await Assembler.assemble(sourceCode)

			if(obj){
				// Create globally-available Simulator class				
				let map = obj.pop()
				globalThis.simulator = new Simulator(obj[0], map)
				globalThis.lastPtr = null
				
				// Globally store .obj file, and symbol table file blobs
				if(globalThis.simulator){
					setObjFilename()
					globalThis.objFile = Assembler.getObjectFileBlob()
					globalThis.symbolTable = Assembler.getSymbolTableBlob()
				}
			}
		}
	}
</script>

<div id="editor-view" role="group" aria-label="Editor workspace">
	<!-- Initially hide Editor contents while application loads -->
	{#if appLoadComplete}
	<section id="ev-right">
		<div class="filler">filler</div>
		<div id="console-ctr" aria-label="Console output to show assembly errors and success" tabindex="0">
			<Console />
		</div>
		<div id="ev-buttons">
			<div id="ss-ctr"><SimulatorStatus /></div>
			<button id="assemble" class="functionBtn" on:click={assembleClick} aria-label="Assemble the program" tabindex="0">
				<span class="material-symbols-outlined">memory</span>
				ASSEMBLE
			</button>
			<button class="switchBtn" on:click={toSimulator} tabindex="0">
				Switch to Simulator
			</button>
		</div>
		
	</section>
	{/if}
	<section id="ev-left">
		<div id="filename" class="workSans" on:mouseenter={showRename} on:mouseleave={showFilename} on:click={setFilename} on:keypress={setFilename} role="button" aria-label="Click to rename workspace file" tabindex="0">
			{showText}
		</div>
		<Editor />
	</section>
</div>

<style>
	#editor-view{
		height: inherit;
		min-height: 100%;
		width: 100%;
		display: flex;
		flex-direction: row-reverse;
	}

	#filename{
		font-size: 15px;
		width: max-content;
		min-width: 50%;
		margin-bottom: 2vh;
		text-align: center;
		cursor: pointer;
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
		justify-items: center;
		width: 100%;
	}

	#ev-right{
		grid-template-rows: auto 1fr auto;
		width: 28%;
		margin-left: 5%;
	}

	#console-ctr{
		max-height: 41vh;
	}

	#ev-buttons{
		margin-top: 2vh;
	}

	#ss-ctr{
		margin-bottom: 4vh;
		overflow: visible;
		max-width: 18vw;
	}

	.functionBtn, .switchBtn{
		width: 100%;
		padding: 0.8em 0 0.8em 0;
		margin-top: 1vh;
		text-align: center;
	}

	@media (max-width: 1300px) {
		.functionBtn{
			font-size: 18px !important;
		}

		#editor-view{
			display: grid;
			grid-template-columns: 100%;
			grid-template-rows: 90vh 100vh;
		}

		#ev-right{
			grid-row: 2/3;
			width: 100%;
			grid-template-rows: auto 60vh 18% 1fr;
			margin-bottom: 20vh;
			margin-left: 0;
		}

		#console-ctr{
			max-height: 95%;
		}

		#ev-buttons{
			display: grid;
			width: 100%;
			grid-template-columns: auto 40vw;
			grid-template-rows: auto 6.5em;
			justify-items: flex-end;
		}

		#ev-buttons button{
			width: 90%;
		}

		#ss-ctr{
			margin: 1vh 5% 4vh 0;
			transform: scale(1.1);
			width: 25%;
			grid-column: 1/3;
			justify-self: center;
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