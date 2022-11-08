<script>
	import { onMount } from 'svelte';
    import Register from "./Register.svelte";
    import Memory from "./Memory.svelte";
    import Console from "./Console.svelte";
    import StepControls from "./StepControls.svelte";
    import JumpControls from "./JumpControls.svelte";
	import SimulatorStatus from './SimulatorStatus.svelte';
	import { reloadOverride } from './stores';

	// function toEditor() {
	// 	currentView.set("editor")
	// }

	let orig=""
	$: pc = 512
	$: currPtr = -1
	$: memMap = []
	$: regMap = [
        ["R0", "0x0", "0"],
        ["R1", "0x0", "0"],
        ["R2", "0x0", "0"],
        ["R3", "0x0", "0"],
        ["R4", "0x0", "0"],
        ["R5", "0x0", "0"],
        ["R6", "0x0", "0"],
        ["R7", "0x0", "0"],
        ["PSR", "0x2", "2", "CC: Z"],
        ["PC", "0x2", "512"],
        ["MCR", "0x0", "0"],
    ]
	let shortJumpOffset = 5
	let longJumpOffset = 23
	let numRegisters = 8

	function newPC(event){
		pc = event.detail.text
		updateRegisters()
	}

	onMount(() => {
		if(globalThis.simulator){
			pc = globalThis.simulator.getPC()
			orig = "x" + pc.toString(16)
			if(globalThis.lastPtr)
				currPtr = globalThis.lastPtr
			else
				currPtr = pc
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
			updateRegisters()
		}

		// Save last pointer On Destroy
        return () => {
            globalThis.lastPtr = currPtr
        }
	});

	
	// Detect memory reload override
    reloadOverride.subscribe(value => {
		let override = value
        if(override){
			memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
			pc = globalThis.simulator.getPC()
			updateRegisters()
		}
	});

	// Update Register Map
	function updateRegisters(){
		if(globalThis.simulator){
			let tempRegMap = []
			for(let n=0; n<numRegisters; n++){
				let regName = "R" + n
				let regDec = globalThis.simulator.getRegister(n)
				let regHex = "0x" + regDec.toString(16)
				tempRegMap.push([regName, regHex, regDec.toString()])
			}

			let cc = "Z"
			let psrDec = globalThis.simulator.getPSR()
			let psrHex = "0x" + psrDec.toString(16)
			tempRegMap.push(["PSR", psrHex, psrDec])

			tempRegMap.push(["PC", "0x"+pc.toString(16), pc.toString(), "CC:"+cc])

			tempRegMap.push(["MCR", "0x0", "0"])

			regMap = tempRegMap
		}
	}


	// Step controls
	function step(event){
		if(globalThis.simulator){
			let control = event.detail.text
		
			if(control == "in"){
				globalThis.simulator.stepIn()
				pc = globalThis.simulator.getPC()
			}
			else if(control == "out"){
				globalThis.simulator.stepOut()
				pc = globalThis.simulator.getPC()
			}
			else if(control == "over"){
				globalThis.simulator.stepOver()
				pc = globalThis.simulator.getPC()
			}
			else if(control == "run"){
				globalThis.simulator.run()
				pc = globalThis.simulator.getPC()
			}

			// Continue tracking PC by going to a different page of memory range
			if(Math.abs(pc-currPtr) >= longJumpOffset){
				currPtr = pc
				memMap = globalThis.simulator.getMemoryRange(currPtr, currPtr+longJumpOffset)
			}
		}
		
		updateRegisters()
	}

	// Jump controls
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
	
</script>

<div id="sim-view">
	<section id="sv-left">
		<div class="workSans componame">Registers</div>
		<Register map={regMap} on:updatePC={newPC} />
        <StepControls on:step={step} />
        <div id="console-ctr"><Console /></div>
	</section>
	<section id="sv-right">
		<div id="sv-right-top">
        	<div class="workSans componame">Memory</div>
			<SimulatorStatus />
		</div>
		<Memory extPC={pc} ptr={currPtr} map={memMap} on:updatePC={newPC} />
        <JumpControls orig={orig} on:jump={jump} />
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
		align-self: flex-end;
		cursor: default;
	}

	#sv-left, #sv-right{
		height: 100%;
		width: 100%;
		display: grid;
		grid-row-gap: 2vh;
	}

	#sv-left{
		grid-template-rows: 2em auto auto 1fr;
	}

	#sv-right{
		grid-template-rows: 2em auto 1fr;
	}

	#sv-right-top{
		display: flex;
		justify-content: space-evenly;
	}

	#console-ctr{
		max-height: 25vh;
	}

	@media (max-width: 1300px) {
        #console-ctr{
			max-height: 50vh;
		}
	}
</style>