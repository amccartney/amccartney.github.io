<script>
    export let background = "transparent";
    export let style = "";
    export let className = "";
</script>

<section
    style="background: {background}; {style}"
    class="custom-section {className}"
>
    <div class="section-content">
        <slot />
    </div>
</section>

<style>
    .custom-section {
        width: 100%;
    }
    .section-content {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;

    }
    @media (min-width: 800px) {
        .section-content {
            padding: calc(var(--spacing) * 12) 20px;
        }
    }
</style>