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
	let pc = 512
	$: currPtr = pc
	let shortJumpOffset = 5
	let longJumpOffset = 23

	// Memory mapping function
	function newMemoryMap(event){
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
        <StepControls />
        <Console />
	</section>
	<section id="sv-right">
        <div class="workSans componame">Memory</div>
		<Memory ptr={currPtr} />
        <JumpControls on:jump={newMemoryMap} />
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