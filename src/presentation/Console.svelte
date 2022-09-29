<div id="consoleCtr">
    <div id="console-inner">
        console empty
    </div>
    <div id="clear-console">CLEAR</div>
</div>

<style>
    #consoleCtr{
        height: 100%;
        width: inherit;
        display: grid;
        justify-items: center;
        align-items: center;
        position: relative;
    }

    #console-inner{
        height: 80%;
        width: 85%;
        font-size: 12px;
    }

    #clear-console{
        position: absolute;
        z-index: 3;
        top: 5%;
        right: 5%;
        color: var(--d-comment);
        cursor: pointer;
        font-size: 13px;
    }
</style>