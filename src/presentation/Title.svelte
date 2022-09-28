<script>
    let githubRef = `Source code on <a href="https://github.com/aidan-garvey/WebLC3">Github</a>`

    function addJiggle(){
        this.classList.add("jiggle")
        this.parentElement.querySelector("p").innerHTML="Click to read the guide"
    }

    function removeJiggle(){
        this.classList.remove("jiggle")
        this.parentElement.querySelector("p").innerHTML=githubRef
    }
</script>

<div id="title">
    <h1 on:mouseenter={addJiggle} on:mouseleave={removeJiggle}>
        Web<span id="lc3">LC3</span>
    </h1>
    <p>{@html githubRef}</p>
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
</style>
