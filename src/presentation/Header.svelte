<!-- 
    Header.svelte
        Header component on top of page including title, menu items, and mode switch
-->

<script>
    import Menu from "./Menu.svelte"
    import ModeSwitch from "./ModeSwitch.svelte"
    import Title from "./Title.svelte"
    import { onMount } from "svelte"
    import { currentView } from './stores.js'

    let appLoadComplete = false
    onMount(() => { appLoadComplete = true });

    // Set view-specific interface and controls
    let currView = "editor"
    currentView.subscribe(value => { currView = value });
</script>

<div id="header" role="banner" aria-label="WebLC3 site top banner">
    <div id="header-inner" role="group" aria-labelledby="header">
        <!-- Initially hide Menu while application loads -->
        {#if appLoadComplete}
            <Title subtitle="Read the {currView} guide" />
            <Menu currView={currView} />
            <ModeSwitch />
        {:else}
            <Title />
        {/if}
    </div>
</div>

<style>
    #header{
        overflow: auto;
        width: 100vw;
        height: 14vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #header-inner{
        height: 80%;
        width: 95%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    @media (max-width: 1200px) {
	    #header{
		    height: 20vh;
            max-height: 9em;
	    }
    }
</style>