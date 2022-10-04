<div id="jump-controls">
    <div>
        <span>JUMP</span><span class="mute"> :</span>
        <input id="jump-input" type="text" class="sourceCodePro">
    </div>
    <div id="jump-buttons">
        <div>PC</div>
        <div>◀</div>
        <div>◅</div>
        <div>▻</div>
        <div>▶</div>
    </div>
</div>

<style>
    #jump-controls{
        width: 60%;
        display: flex;
        justify-content: space-between;
        margin-top: 2vh;
    }

    .mute{
        color: #5B5B5B;
    }

    #jump-input{
        width: 4em;
        border: none;
        outline: none;
        background: none;
        border-bottom: 1px solid #5B5B5B;
    }

    #jump-buttons{
        display: flex;
        font-size: 1.5em;
    }

    #jump-buttons div{
        margin: 0 0.6em 0 0.6em;
        cursor: pointer;
    }

</style>