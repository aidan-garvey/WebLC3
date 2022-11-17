<!-- 
    +layout.svelte
        Defines the application layout 
-->

<script>
    import { onMount } from 'svelte'
    import { toggleHelp } from '../presentation/stores';

    // Allow window scrolling on application load
    onMount(() => {
        document.body.style.overflowY = "scroll"
	});

    // Open popup with WebLC3 help documentation to overlay on page
    let openHelpModal = false
	toggleHelp.subscribe(value => {
		openHelpModal = value
	});

    function close(){ toggleHelp.set(false) }
</script>

<div id="content">
    <slot />
    {#if openHelpModal}
        <div id="modal" on:click={close}></div>
        <div id="help">
            <div id="help-inner" class="sourceCodePro">
                <div class="help-content">
                    <h2 class="workSans">User Guide</h2>
                    <p>Help documentation will be supplied in the future.</p>
                </div>
                <div class="note">( Press anywhere outside box to close )</div>
            </div>
        </div>
    {/if}
</div>

<style>
    #content{
        height: inherit;
        width: inherit;
        position: relative;
    }

    #help{
        height: 70vh;
        width: 65vw;
        position: absolute;
        z-index: 15;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: grid;
        justify-items: center;
        align-items: center;
    }

    #modal{
        position: absolute;
        z-index: 14;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        cursor: pointer;
        background-color: rgba(0,0,0,0.2);
    }

    #help-inner{
        height: 88%;
        width: 85%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    #help-inner h2{
        font-size: 2.4em;
        font-weight: 600;
        margin-bottom: 6vh
    }

    #help-inner p{
        font-size: 16px;
    }

    .note{
        height: max-content;
        width: 100%;
        text-align: right;
        font-size: 11px;
        margin-bottom: 3vh;
    }
</style>
