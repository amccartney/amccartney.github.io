<script>
    export let title = "";
</script>

<div class="section-head gap-6 flex items-center mb-12">
    <h2>{title}</h2>
    <div class="olivetti-red-bar"></div>

</div>

<style>

    .section-head {
        margin-bottom: 2rem;
        display: flex;
    }

    .section-head h2 {
        margin: 0;
        text-transform: uppercase;
        font-weight: 600;
        color: var(--olivetti-charcoal);
    }

    .olivetti-red-bar {
        background-color: var(--olivetti-red);
        height: 1px;
        width: 40px;
        margin-top: 0.75rem;
        border-radius: 2px;
        flex: 1;
    }

</style>