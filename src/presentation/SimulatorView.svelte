<script>
	import { onMount } from 'svelte';
    import Register from "./Register.svelte";
    import Memory from "./Memory.svelte";
    import Console from "./Console.svelte";
    import StepControls from "./StepControls.svelte";
    import JumpControls from "./JumpControls.svelte";
	import { currentView, reloadOverride } from './stores';
	import UI from "./ui";

	function toEditor() {
		currentView.set("editor")
	}

	$: pc = 512
	$: currPtr = -1
	$: memMap = []
	let shortJumpOffset = 5
	let longJumpOffset = 23

	function newPC(event){
		pc = event.detail.text
	}

	onMount(() => {
		if(globalThis.simulator){
			pc = globalThis.simulator.getPC()
			if(globalThis.lastPtr)
				currPtr = globalThis.lastPtr
			else
				currPtr = pc
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
		}

		// Save last pointer On Destroy
        return () => {
            globalThis.lastPtr = currPtr
        }
	});

	
	// Detect memory reload override
    reloadOverride.subscribe(value => {
		let override = value
        if(override)
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
	});


	// Step controls
	function step(event){
		if(globalThis.simulator){
			let control = event.detail.text
		
			if(control == "in"){
				UI.printConsole("Stepping in.")
				globalThis.simulator.stepIn()
				pc = globalThis.simulator.getPC()
				UI.appendConsole("New PC: " + pc + " (x" + pc.toString(16) + ")")
			}
			else if(control == "out"){
				globalThis.simulator.stepOut()
				UI.printConsole("Stepping out.")
				pc = globalThis.simulator.getPC()
				UI.appendConsole("New PC: " + pc + " (x" + pc.toString(16) + ")")
			}
			else if(control == "over"){
				globalThis.simulator.stepOver()
				UI.printConsole("Stepping over.")
				pc = globalThis.simulator.getPC()
				UI.appendConsole("New PC: " + pc + " (x" + pc.toString(16) + ")")
			}
			else if(control == "run"){
				globalThis.simulator.run()
				UI.printConsole("Running simulator.")
				pc = globalThis.simulator.getPC()
				UI.appendConsole("New PC: " + pc + " (x" + pc.toString(16) + ")")
			}

			// Continue tracking PC by going to a different page of memory range
			if(Math.abs(pc-currPtr) >= longJumpOffset){
				currPtr = pc
				memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
			}
		}
		
		/*----------------------------------------------------
			TODO: Update each register
		-----------------------------------------------------*/
	}

	// Jump controls
	function jump(event){
		if(globalThis.simulator){
			let control = event.detail.text

			if(control == "pc"){
				UI.printConsole("Jumped to PC.")
				let start = globalThis.simulator.getPC()
				let end = globalThis.simulator.getPC() + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = pc
			}
			else if(control == "ljb"){
				UI.printConsole("Long jumped backward.")
				let start = currPtr - longJumpOffset
				let end = currPtr
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr - longJumpOffset
			}
			else if(control == "jb"){
				UI.printConsole("Jumped backward.")
				let start = currPtr - shortJumpOffset
				let end = currPtr - shortJumpOffset + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr - shortJumpOffset
			}
			else if(control == "jf"){
				UI.printConsole("Jumped forward.")
				let start = currPtr + shortJumpOffset
				let end = currPtr + shortJumpOffset + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr + shortJumpOffset
			}
			else if(control == "ljf"){
				UI.printConsole("Long jumped forward.")
				let start = currPtr + longJumpOffset
				let end = currPtr + longJumpOffset*2
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = currPtr + longJumpOffset
			}
			else{
				let hex = control.toString(16)
				UI.printConsole("Jumped to memory location at x" + hex + ".")
				let start = control
				let end = control + longJumpOffset
				memMap = globalThis.simulator.getMemoryRange(start, end)
				currPtr = control
			}
		}
	}
	
</script>

<div id="sim-view">
	<section id="sv-left">
		<div class="workSans componame">Registers</div>
		<Register />
        <StepControls on:step={step} />
        <Console />
	</section>
	<section id="sv-right">
        <div class="workSans componame">Memory</div>
		<Memory extPC={pc} ptr={currPtr} map={memMap} on:updatePC={newPC} />
        <JumpControls on:jump={jump} />
        <button class="switchBtn" on:click={toEditor}>Back to Editor</button>
	</section>
</div>

<style>
	#sim-view{
		height: 100%;
		width: 100%;
		display: grid;
		grid-template-columns: 30% 65%;
		grid-column-gap: 5%;
	}

	.componame{
		font-size: 15px;
		width: 100%;
		text-align: center;
	}

	#sv-left, #sv-right{
		height: 100%;
		width: 100%;
		display: grid;
		grid-row-gap: 1vh;
	}

	#sv-left{
		grid-template-rows: auto auto auto 1fr;
	}

	#sv-right{
		grid-template-rows: auto auto 1fr 3em;
	}

	.switchBtn{
		padding: 0.8em 3em 0.8em 3em;
		margin-top: 1vh;
		text-align: center;
        align-self: flex-end;
        justify-self: flex-end;
	}

	@media (max-width: 900px) {
		.switchBtn{
			font-size: 14px !important;
		}
	}

	@media (max-width: 600px) {
		.switchBtn{
			font-size: 12px !important;
		}
	}
</style>