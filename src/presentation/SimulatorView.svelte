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

	// PC is on x0200 at startup
	$: pc = 512
	$: currPtr = 512
	let shortJumpOffset = 5
	let longJumpOffset = 23

	function newPC(event){
		pc = event.detail.text
	}

	let breakpoints = []
	let atBreakpoint = false

	function updateBP(event){
		breakpoints = event.detail.text
	}

	// Temporary
	function stepDemo(){
		pc += 1
		let rows = 23
		if(pc-currPtr == rows)
			currPtr = pc

		let currPC = document.querySelector(".ptr-selected")
		if(currPC)
			currPC.classList.remove("ptr-selected")
		let newPCButton = document.getElementById("ptr-" + pc)
		if(newPCButton)
			newPCButton.classList.add("ptr-selected")
	}

	// Step controls
	function step(event){
		let control = event.detail.text
		let consoleInner = document.getElementById("console-inner")
        consoleInner.classList.remove("empty")

		if(control == "in"){
			consoleInner.innerText = "Stepping in."
			stepDemo()
		}
		else if(control == "out"){
			consoleInner.innerText = "Stepping out."
		}
		else if(control == "over"){
			consoleInner.innerText = "Stepping over."
		}
		else if(control == "run"){
			consoleInner.innerText = "Running simulator."

			while(!atBreakpoint && pc < 65535){
				stepDemo()
				atBreakpoint = breakpoints.includes(pc)
			}

			if (atBreakpoint)
				consoleInner.innerText += "\nBreakpoint detected at x" + pc.toString(16) + "."
			else
				consoleInner.innerText += "\n\nYou reached the end of the world (wow, must be exhausting to run this far)\n\nCome back home to x3000."

			atBreakpoint = false
		}

		/*----------------------------------------------------
			TODO: Get new register map and update registers
		-----------------------------------------------------*/
		/*----------------------------------------------------
			TODO: Get console logs
		-----------------------------------------------------*/
	}

	// Jump controls
	function jump(event){
		let control = event.detail.text
		let consoleInner = document.getElementById("console-inner")
        consoleInner.classList.remove("empty")

		if(control == "pc"){
			consoleInner.innerText = "Jumped to PC."
			currPtr = pc
		}
		else if(control == "ljb"){
			consoleInner.innerText = "Long jumped backward."
			currPtr = currPtr - longJumpOffset
		}
		else if(control == "jb"){
			consoleInner.innerText = "Jumped backward."
			currPtr = currPtr - shortJumpOffset
		}
		else if(control == "jf"){
			consoleInner.innerText = "Jumped forward."
			currPtr = currPtr + shortJumpOffset
		}
		else if(control == "ljf"){
			consoleInner.innerText = "Long jumped forward."
			currPtr = currPtr + longJumpOffset
		}
		else{
			let hex = control.toString(16)
			consoleInner.innerText = "Jumped to memory location at x" + hex + "."
			currPtr = control
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
		<Memory pc={pc} ptr={currPtr} on:updatePC={newPC} on:updateBP={updateBP} />
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