<script>
    export let variant = "default"; // "default" or "primary"
    export let type = "button";
</script>

<button class="{variant}" type={type}>
    <slot />
</button>

<style>
    button {
        display: block;
        margin: 0.7rem auto;
        padding: 0.7rem 2rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid #d32f2f;
        background: #fff;
        color: #d32f2f;
        transition: background 0.2s, color 0.2s;
    }
    button.primary {
        background: #d32f2f;
        color: #fff;
        border: none;
    }
</style>