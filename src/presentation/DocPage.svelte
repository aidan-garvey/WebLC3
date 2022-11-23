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
    <p>{@html content}</p>
    <div id="featureCompo" style="height:{featureHeight};">
        <slot>
            <!-- For optional feature component -->
        </slot>
    </div>
    {#if footnote}
        <p id="footnote">{footnote}</p>
    {/if}
</div>

<style>
    #docs{
        height: 100%;
        width: 100%;
    }

    #docs h2{
        font-size: 2.4em;
        font-weight: 600;
        margin-bottom: 6vh
    }

    #docs p{
        font-size: 16px;
    }

    #featureCompo{
        max-height: 25vh;
    }

    #footnote{
        font-size: 11px;
        font-style: italic;
    }
</style>
