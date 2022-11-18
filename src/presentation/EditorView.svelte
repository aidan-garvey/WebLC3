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
	// Reflect current .asm program filename
	export let filename = "No file provided"
	openedFile.subscribe(value => { filename = value });
	// Set new filename
	function setFilename(){
		let newInput = createInputBox()
        this.appendChild(newInput)
        newInput.focus()
	}

	// Create text input box for entering new filename
	function createInputBox(){
        let newInput = document.createElement("input")
        newInput.placeholder = "Enter new filename"
        
        // Close input box
        newInput.addEventListener("blur", function leave(e) {
            try {
                let parent = e.target.parentElement
				saveInput(e.target.value)
                parent.removeChild(e.target)
            } catch {}
        })
        newInput.addEventListener("keydown", function leave(e) {
            if(e.key == "Enter"){
                try {
                    let parent = e.target.parentElement
					saveInput(e.target.value)
                    parent.removeChild(e.target)
                } catch {}
            }
        })

		// Commit new filename if validations pass. Else, rollback (old value will not change)
		function saveInput(newValue){
			if(newValue.length > 0){
				newValue = newValue.replace(" ","_")
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

	// Set filename of assembled .obj file
	function setObjFilename(){
		if(filename == "No file provided"){
			filename = "untitled.asm"
			openedFile.set("untitled.asm")
			assembledFile.set("untitled.obj")
		}
		// Replace ".asm" extension with ".obj"
		else
			assembledFile.set(filename.substring(0,filename.length-4)+".obj")
	}


	/* ASSEMBLY */
	
	// Assemble program
	async function assembleClick(){
		let editor = globalThis.editor
		if(editor){
			let sourceCode = editor.getValue()
			let obj = await Assembler.assemble(sourceCode)

			// Globally store new Simulator class and .obj file
			if(obj){
				globalThis.objFile = obj
				let map = obj.pop()
				globalThis.simulator = new Simulator(obj[0], map)
				globalThis.lastPtr = null
				if(globalThis.simulator)
					setObjFilename()
			}
		}
	}
</script>

<div id="editor-view">
	<section id="ev-left">
		<div id="filename" class="workSans" on:click={setFilename}>{filename}</div>
		<Editor />
	</section>

	<!-- Initially hide Editor contents while application loads -->
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
		width: max-content;
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
		width: 25%;
		margin-left: 5%;
		max-width: 25%;
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
			max-width: 100%;
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