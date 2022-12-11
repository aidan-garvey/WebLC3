<!-- 
	SimulatorView.svelte
		This workspace view enables a client to run an assembly program through a built-in application CPU.
		Comprehensive UI suite allows viewing and override of Register and Memory state contents, printing character outputs through Console,
		breakpoint setting, PC override, and Step and Jump controls
-->

<script>
	import { onMount } from 'svelte'
	import Register from "./Register.svelte"
	import Memory from "./Memory.svelte"
	import Console from "./Console.svelte"
	import StepControls from "./StepControls.svelte"
	import JumpControls from "./JumpControls.svelte"
	import SimulatorStatus from './SimulatorStatus.svelte'
	import UI from './ui'
	import { reloadOverride, UIReady, updateMainButton } from './stores'

	// Preset data
	let orig = 0
	$: pc = 512
	$: currPtr = -1
	$: memMap = []
	$: regMap = []
	let shortJumpOffset = 5
	let longJumpOffset = 23
	let numRegisters = 8

	onMount(() => {
		// Load preset or saved states
		if(globalThis.simulator){
			pc = globalThis.simulator.getPC()
			orig = pc
			if(globalThis.lastPtr)
				currPtr = globalThis.lastPtr
			else
				currPtr = pc
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
		}
		updateRegisters()

		// Save last memory pointer on destroy
		return () => { globalThis.lastPtr = currPtr }
	});



	/* DYNAMIC RELOAD */
	
	// Update UI components
	UIReady.subscribe(ready => {
		if(ready){
			updateUI()
			UIReady.set(false)
		}
	});

	// Update Memory map
	reloadOverride.subscribe(override => {
		// Set memory range to start at .orig
		if(override[1])
			currPtr = orig
		// Set memory range to start at currPtr
		if(override[0]){
			pc = globalThis.simulator.getPC()
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
			updateRegisters()
		}
	});

	// Update Register map
	function updateRegisters(){
		// Generate register map
		if(globalThis.simulator){
			let tempRegMap = []
			for(let n=0; n<numRegisters; n++){
				let regName = "R" + n
				let regDec = globalThis.simulator.getRegister(n)
				let regHex = "0x" + regDec.toString(16)
				tempRegMap.push([regName, regHex, globalThis.simulator.signExtend(regDec).toString()])
			}
			let cc = globalThis.simulator.getPSRInfo()[2]
			let psrDec = globalThis.simulator.getPSR()
			let psrHex = "0x" + psrDec.toString(16)
			let mcrDec = globalThis.simulator.getMemory(0xFFFE)
			let mcrHex = "0x" + mcrDec.toString(16)
			tempRegMap.push(["PSR", psrHex, psrDec, "CC:"+cc])
			tempRegMap.push(["PC", "0x"+pc.toString(16), pc.toString()])
			tempRegMap.push(["MCR", mcrHex, mcrDec.toString()])

			regMap = tempRegMap
		} 
		// Use zeroes map component filler
		else{
			regMap = [
				["R0", "0x0", "0"],
				["R1", "0x0", "0"],
				["R2", "0x0", "0"],
				["R3", "0x0", "0"],
				["R4", "0x0", "0"],
				["R5", "0x0", "0"],
				["R6", "0x0", "0"],
				["R7", "0x0", "0"],
				["PSR", "0x2", "2", "CC: Z"],
				["PC", "0x0", "0"],
				["MCR", "0x0", "0"],
			]
		}
	}

	// Update components
	function updateUI(){
		pc = globalThis.simulator.getPC()
		// Continue tracking PC by going to a different page of memory range
		if(Math.abs(pc-currPtr) >= longJumpOffset){
			currPtr = pc
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
		}
		updateRegisters()
	}


	/* DISPATCH AND EVENT HANDLERS */

	// Update PC
	function newPC(event){
		pc = event.detail.text
		updateRegisters()
	}

	// "Light up" a component or table row
	function lightUpComponent(event){
		let compo = document.getElementById(event.detail.text)
		if(compo){
			compo.classList.add("lightup")
			setTimeout(function() {
				compo.classList.remove("lightup")
			}, 400)
		}
	}

	// Execute Step controls
	async function step(event){
		if(globalThis.simulator){
			let control = event.detail.text
			if(control == "in"){ await globalThis.simulator.stepIn() }
			else if(control == "out"){ await globalThis.simulator.stepOut() }
			else if(control == "over"){ await globalThis.simulator.stepOver() }
			else if(control == "run"){ await globalThis.simulator.run()	}
			else if(control == "pause"){ globalThis.simulator.halt() }
			else if(control == "reload"){ 
				// Reload procedure
				globalThis.simulator.reloadProgram()
				currPtr = orig
				pc = globalThis.simulator.getPC()
				memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
				updateRegisters()
				updateMainButton.set(0)
			}
		}
	}

	// Execute Jump controls
	function jump(event){
		if(globalThis.simulator){
			let control = event.detail.text

			if(control == "pc"){
				let start = globalThis.simulator.getPC()
				let end = globalThis.simulator.getPC() + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = pc
			}
			else if(control == "ljb"){
				let start = currPtr - longJumpOffset
				let end = currPtr
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr - longJumpOffset
			}
			else if(control == "jb"){
				let start = currPtr - shortJumpOffset
				let end = currPtr - shortJumpOffset + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr - shortJumpOffset
			}
			else if(control == "jf"){
				let start = currPtr + shortJumpOffset
				let end = currPtr + shortJumpOffset + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr + shortJumpOffset
			}
			else if(control == "ljf"){
				let start = currPtr + longJumpOffset
				let end = currPtr + longJumpOffset*2
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr + longJumpOffset
			}
			else{
				let start = control
				let end = control + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = control
			}
		}
	}

	// Select Console on click
	function focusConsole(event){
		UI.selectConsole()
		event.stopImmediatePropagation()
	}
</script>

<div id="sim-view" role="group" aria-label="Simulator workspace">
	<section id="sv-left">
		<div id="registersLbl" class="componame monoton">Registers</div>
		<Register map={regMap} registers={numRegisters} on:updatePC={newPC} on:lightUp={lightUpComponent} />
		<StepControls on:step={step} />
	</section>
	<button id="c-ctr" on:click={focusConsole} aria-label="Click to focus console and send key interrupts. Unfocus console by clicking anywhere outside this component or other buttons" tabindex="0">
		<Console />
	</button>
	<section id="sv-right">
		<div id="sv-right-top">
			<div id="memoryLbl" class="componame monoton">Memory</div>
			<SimulatorStatus />
		</div>
		<Memory pc={pc} ptr={currPtr} map={memMap} on:updatePC={newPC} on:lightUp={lightUpComponent} />
		<JumpControls orig={"x" + orig.toString(16)} on:jump={jump} />
	</section>
</div>

<style>
	#sim-view{
		height: 100%;
		width: 100%;
		display: grid;
		grid-template-columns: 30% 65%;
		grid-template-rows: auto 1fr;
		grid-column-gap: 5%;
	}

	.componame{
		font-size: 36px;
		width: max-content;
		margin-left: 1vw;
		align-self: flex-start;
		cursor: default;
		z-index: 0;
	}

	#sv-left, #sv-right{
		height: 100%;
		width: 100%;
		display: grid;
		grid-row-gap: 2vh;
	}

	#sv-left{
		grid-template-rows: 2em auto auto;
	}

	#sv-right{
		grid-template-rows: 2em auto 1fr;
		grid-column: 2/3;
		grid-row: 1/3;
	}

	#sv-right-top{
		display: flex;
		justify-content: space-evenly;
	}

	#c-ctr{
		background: unset;
		border-radius: unset;
		padding: unset;
		text-align: left;
		height: 25vh;
		margin-top: 2vh;
	}

	@media (max-width: 1300px) {
		#c-ctr{
			height: 45vh;
		}
	}

	@media (max-width: 900px) {
		#sv-right{
			grid-row: 1/2;
		}

		#c-ctr{
			grid-row: 2/3;
			grid-column: 1/3;
		}
	}
</style>