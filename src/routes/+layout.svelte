<!-- 
    +layout.svelte
        Defines the application layout 
-->

<script>
    import { onMount } from 'svelte'
    import { toggleHelp, currentView } from '../presentation/stores'
    import DocPage from '../presentation/DocPage.svelte'
    import Menu from '../presentation/Menu.svelte'
    import editorDocs from '../docs/editor.yaml'
    import simulatorDocs from '../docs/simulator.yaml'

    // Load data from .yaml files
    let editorPages = editorDocs.pages
    let simulatorPages = simulatorDocs.pages
    let pages = editorPages

    // Allow window scrolling on application load
    onMount(() => { document.body.style.overflowY = "scroll" });

    // Get current view to tailor documentation pages
    currentView.subscribe(view => { 
        if(view == "editor")
            pages = editorPages
        else
            pages = simulatorPages
    });

    // Open popup with WebLC3 help documentation to overlay on page
    let openHelpModal = false
	toggleHelp.subscribe(value => {
		openHelpModal = value
	});

    // Close modal
    function close(){ toggleHelp.set(false) }

    // Change pages
    let num = 0
    $: total = pages.length
    function nextPage(){
        num = (num + 1) % total
    }
</script>

<div id="content">
    <slot />
    {#if openHelpModal}
        <div id="modal" on:click={close}></div>
        <div id="help">
            <div id="help-inner" class="sourceCodePro" on:click={nextPage}>
                <DocPage 
                    title={pages[num].title} 
                    content={pages[num].body}
                    footnote={pages[num].footnote}
                    featureHeight="16vh" 
                >
                    <Menu readOnly={true} />
                    {#if pages[num].component}
                        <span>TBD: Replace above with {pages[num].component}</span>
                    {/if}
                </DocPage>
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
        overflow-y: scroll;
    }

    .note{
        height: max-content;
        width: 100%;
        text-align: right;
        font-size: 10px;
        margin-bottom: 3vh;
    }
</style>
