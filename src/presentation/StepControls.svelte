<div id="step-controls">
    <button id="run" class="functionBtn">
        ▶ RUN
    </button>
    <button id="step-in" class="functionBtn">
        <span class="material-symbols-outlined">subdirectory_arrow_right</span>
         Step in
    </button>
    <button id="step-out" class="functionBtn">
        <span class="material-symbols-outlined">subdirectory_arrow_left</span>
         Step out
    </button>
    <button id="step-over" class="functionBtn">
        <span class="material-symbols-outlined">u_turn_right</span>
         Step over
    </button>
</div>

<style>
    #step-controls{
        height: 15vh;
        display: grid;
        grid-template-columns: 55% 30%;
        grid-template-rows: 30% 30% 30%;
        grid-column-gap: 15%;
        grid-row-gap: 3%;
        margin-top: 1vh;
    }

    #run{
        grid-row: 1/4;
        grid-column: 1/2;
    }

    #step-in, #step-out, #step-over{
        font-size: 15px;
        text-align: left;
        border-radius: 10px;
        padding-left: 1.2em;
        justify-content: flex-start !important;
    }

    .functionBtn{
		text-align: center;
	} 

    .functionBtn span{
		margin-right: 4%;
	} 
</style>