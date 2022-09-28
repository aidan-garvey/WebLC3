<script>
    import Menu from "./Menu.svelte";
    import ModeSwitch from "./ModeSwitch.svelte";
    import Title from "./Title.svelte";
</script>

<div id="header">
    <div id="header-inner">
        <Title />
        <Menu />
        <ModeSwitch />
    </div>
</div>

<style>
    #header{
        overflow: auto;
        width: 100vw;
        height: 15vh;
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
</style>