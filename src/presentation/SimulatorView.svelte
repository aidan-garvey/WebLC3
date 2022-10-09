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
		<Memory />
        <JumpControls />
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