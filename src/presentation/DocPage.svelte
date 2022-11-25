<!-- 
    DocPage.svelte
        Dynamic display for User Guide pages
-->

<script>
    export let title = "WebLC3"
    export let content = "Documentation cannot be loaded. View in <a href='https://github.com/aidan-garvey/WebLC3'>raw text</a>."
    export let footnote = ""
    export let featureHeight = "25vh"
</script>

<div id="docs">
    <h2 class="workSans"> {title} </h2>
    <div id="featureCompo" style="height:{featureHeight};">
        <slot>
            <!-- For optional feature component -->
        </slot>
    </div>
    <p id="docBody" class="workSans">{@html content}</p>
    {#if footnote}
        <p id="footnote">{footnote}</p>
    {/if}
</div>

<style>
    #docs{
        height: 100%;
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

    #featureCompo{
        margin: 3vh 0 5vh 0;
    }

    #footnote{
        font-size: 12px !important;
        font-style: italic;
    }

    @media (max-width: 1100px) {
        #docs h2{
            max-width: 60%;
        }
	}
</style>
