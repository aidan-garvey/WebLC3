<!-- 
    [slug]/+page.svelte
        Render plain documentation via routes
-->

<script>
    // Get the route string
    export let data
    let docId = data.slug

    import ModeSwitch from "../../presentation/ModeSwitch.svelte"
    import editorDocs from '../../docs/editor.yaml'
    import simulatorDocs from '../../docs/simulator.yaml'
    import "../../app.css"

    export let title = "404 Not Found"
    export let content = "Documentation for " + docId + " cannot be loaded."
    export let footnote = ""

    // Load data from .yaml files
    let editorPages = editorDocs.pages
    let simulatorPages = simulatorDocs.pages

    // Collect page IDs
    let pageList = Object.values(editorPages).concat(Object.values(simulatorPages))
    let docIds = pageList.map(x => x.title.toLowerCase())
    let docIdsDashDelimiter = docIds.map(x => x.replaceAll(' ', '-'))
    let docIdsUnderscoreDelimiter = docIds.map(x => x.replaceAll(' ', '_'))

    // Search for documentation page from all delimiter patterns
    let pageIndex = docIds.indexOf(docId.toLowerCase())
    if(pageIndex == -1){

        pageIndex = docIdsDashDelimiter.indexOf(docId.toLowerCase())
        if(pageIndex == -1){

            pageIndex = docIdsUnderscoreDelimiter.indexOf(docId.toLowerCase())
            if(pageIndex >= 0) { getPageData(pageIndex) }
        
        } else { getPageData(pageIndex) }

    } else { getPageData(pageIndex) }

    // Return page data to be rendered
    function getPageData(index){
        title = pageList[index].title
        content = pageList[index].body
        footnote = pageList[index].footnote
    }
</script>

<div id="docPage" aria-label="User guide for LC3 terminologies and WebLC3 interactions">
    <section aria-label="Documentation page for {docId}">
        <ModeSwitch />
        <div id="docs">
            <h2 class="workSans" role="definition" aria-label="Page title"> {title} </h2>
            <p id="docBody" class="workSans" role="term" aria-label="Page information">{@html content}</p>
            {#if footnote}
                <p id="footnote" aria-label="Extra information">{footnote}</p>
            {/if}
        </div>
        <a id="toHome" href='/'> Return to homepage </a>
    </section>
</div>

<style>
    #docPage{
        height: max-content;
        min-height: 100vh;
        display: grid;
        justify-items: center;
        align-items: center;
    }

    #docPage section{
        min-height: 85vh;
        width: 60vw;
        padding: 5vh 0 10vh 0;
    }

    #docs{
        height: max-content;
        width: 97%;
    }

    #docs h2{
        font-size: 2.4em;
        font-weight: 600;
        margin-bottom: 5vh;
        width: 100%;
        max-width: 70%;
    }

    #docs p{
        font-size: 17px;
        letter-spacing: 1px;
        line-height: 2.4;
    }

    #footnote{
        font-size: 12px !important;
        font-style: italic;
    }

    #toHome{
        line-height: 5em;
        font-size: 115%;
        font-weight: 500;
        float: right;
    }

    @media (max-width: 1100px) {
        #docs h2{
            max-width: 60%;
        }
    }
</style>