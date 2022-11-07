<script>
    import Menu from "./Menu.svelte"
    import ModeSwitch from "./ModeSwitch.svelte"
    import Title from "./Title.svelte"
    import { onMount } from "svelte"

    let appLoadComplete = false
    onMount(() => {
        appLoadComplete = true
	});

</script>

<div id="header">
    <div id="header-inner">
        <Title />
        {#if appLoadComplete}
            <Menu />
            <ModeSwitch />
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
	    }
    }
</style>