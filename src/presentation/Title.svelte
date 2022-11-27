<!-- 
    Title.svelte
        WebLC3 title component
-->

<script>
    import { toggleHelp } from './stores.js';

    export let subtitle = `Source code on <a href="https://github.com/aidan-garvey/WebLC3">Github</a>`

    // Aesthetic animation on hover
    function addJiggle(){
        this.classList.add("jiggle")
    }
    function removeJiggle(){
        this.classList.remove("jiggle")
    }

    // Open help documentation modal
    function openHelp(){
        toggleHelp.set(true)
    }
</script>

<link href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
<div id="title" aria-label="WebLC3 title component">
    <h1 on:mouseenter={addJiggle} on:mouseleave={removeJiggle} on:click={openHelp} on:focus={addJiggle}  on:blur={removeJiggle} on:keypress={openHelp} role="button" aria-label="WebLC3 documentation toggle" aria-haspopup="dialog" aria-pressed="false" tabindex="0">
        Web<span id="lc3">LC3</span>
    </h1>
    <p on:click={openHelp}>{@html subtitle}</p>
    <span class="jiggle"></span>
</div>

<style>
    #title{
        height: max-content;
        line-height: 10px;
        cursor: pointer;
    }

    #title h1{
        font-weight: 400;
    }

    #lc3{
        font-weight: 700;
    }

    .jiggle{
        animation: 2.5s jiggle ease-in-out infinite;
    }

    @keyframes jiggle{
        0%{
            transform: translateY(0em) rotate(0deg);
        }
        20%{
            transform: translateY(-0.2em) rotate(0deg);
        }
        25%{
            transform: translateY(-0.2em) rotate(-5deg);
        }
        30%{
            transform: translateY(-0.2em) rotate(5deg);
        }
        35%{
            transform: translateY(-0.2em) rotate(-5deg);
        }
        40%{
            transform: translateY(-0.2em) rotate(0deg);
        }
        60%{
            transform: translateY(0em) rotate(0deg);
        }
    }

    @media (max-width: 600px) {
        #title p{
            font-size: 14px;
        }
    }
</style>
