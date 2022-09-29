<script>
    import Header from "../presentation/Header.svelte";
    import Workspace from "../presentation/Workspace.svelte";
    import "../app.css";

    $: currView = "editor"
    function loadView(event) {
        currView = event.detail.text
	}
</script>

<Header view={currView} />
<Workspace on:changeView={loadView} />