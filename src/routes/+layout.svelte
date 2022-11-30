<!-- 
    +layout.svelte
        Defines the application layout 
-->

<script>
    import { onMount } from 'svelte'
    import { toggleHelp, currentView } from '../presentation/stores'
    import DocPage from '../presentation/DocPage.svelte'
    import Previews from '../presentation/Previews.svelte'
    import editorDocs from '../docs/editor.yaml'
    import simulatorDocs from '../docs/simulator.yaml'

    // Load data from .yaml files
    let editorPages = editorDocs.pages
    let simulatorPages = simulatorDocs.pages
    let pages = editorPages
    let openHelpModal = false

    onMount(() => { 
        // Allow window scrolling on application load
        document.body.style.overflowY = "scroll" 
    
        // Open popup with WebLC3 help documentation to overlay on page
        toggleHelp.subscribe(value => {
            openHelpModal = value

            // Focus next page button
            setTimeout(function() {
                let next = document.getElementById("nextBtn")
                if(next)
                    next.focus()
            }, 300);
        });
    });

    // Change pages
    let num = 0
    $: total = pages.length
    function prevPage(){
        if(num-1 < 0)
            num = total - 1
        else
            num = (num - 1) % total
        scrollTop()
    }
    function nextPage(){
        num = (num + 1) % total
        scrollTop()
    }
    function scrollTop(){
        let docContent = document.getElementById("docContent")
        if(docContent)
            docContent.scrollTo(0,0) // Set scrollbar of loaded page to top
    }

    // Get current view to tailor documentation pages
    currentView.subscribe(view => { 
        if(view == "editor")
            pages = editorPages
        else
            pages = simulatorPages
        num = 0 // Reset to first page
    });

    // Close modal
    function close(){ toggleHelp.set(false) }
</script>

<div id="content">
    <slot />
    {#if openHelpModal}
        <div id="modal" on:click={close}></div>
        <div id="help" role="dialog" aria-label="User guide for LC3 terminologies and WebLC3 interactions">
            <div id="help-inner" class="sourceCodePro">
                <div id="buttonSet" role="menu" aria-label="User guide navigation buttons" aria-activedescendant="nextBtn">
                    <button id="prevBtn" on:click={prevPage} role="menuitem" aria-label="Previous guide page" tabindex="0"> 
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button id="nextBtn" on:click={nextPage}  role="menuitem" aria-label="Next guide page" tabindex="0">
                        <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
                <div id="docContent" aria-label="Scrollable body" tabindex="0">
                    <DocPage 
                        title={pages[num].title} 
                        content={pages[num].body}
                        footnote={pages[num].footnote}
                        featureHeight="max-content" 
                    >
                        <Previews id={pages[num].component} />
                    </DocPage>
                </div>
                <button class="note" on:click={close} aria-label="Close user guide dialog">( Click here or press anywhere outside box to close )</button>
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
        position: relative;
        height: 88%;
        width: 85%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    #buttonSet{
        z-index: 5;
        position: absolute;
        top: 2%;
        right: 10%;
        display: flex;
    }

    #buttonSet button span{
        transform: scale(1.4);
    }

    #prevBtn, #nextBtn{
        height: 3em;
        width: 3em;
        border-radius: 50%;
        font-size: 30px;
        display: grid;
        justify-items: center;
        align-items: center;
        margin-left: 1em;
        border-width: 3px;
    }

    #docContent{
        z-index: 4;
        height: 59vh;
        width: 100%;
        overflow-y: scroll;
    }

    .note{
        height: max-content;
        width: 100%;
        text-align: right;
        font-size: 10px;
        margin-bottom: 3vh;
        background: unset;
        padding: unset;
        border: unset;
    }

    @media (max-width: 1300px) {
        #modal{
            height: 215vh;
        }

        #docContent{
            height: 109vh;
        }
        
        #help{
            height: 130vh;
            width: 80vw;
        }
    }

    @media (max-width: 1000px) {
        #buttonSet button span{
            transform: scale(1.3);
        }

        #prevBtn, #nextBtn{
            height: 2em;
            width: 2em;
            border-width: 2px;
        }
    }

    @media (max-width: 600px) {
        #buttonSet{
            top: -5%;
            left: 50%;
            transform: translateX(-45%);
        }

        #buttonSet button span{
            transform: scale(1);
        }

        #prevBtn, #nextBtn{
            height: 1.6em;
            width: 1.6em;
            margin: 0.2em;
        }
    }
</style>
