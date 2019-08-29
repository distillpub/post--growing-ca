<script>
  let count = 1;

  // the `$:` means 're-run whenever these values change'
  $: doubled = count * 2;
  $: quadrupled = doubled * 2;

  function handleClick() {
    count += 1;
    console.log("inc count");
  }

  function reset() {
    count = 1;
  }
</script>

<style>
  p {
    margin: 0;
  }
</style>

<p>
  <span>{count} * 2 = {doubled}</span>
  , and
  <span>{doubled} * 2 = {quadrupled}</span>
</p>

<button on:click={handleClick}>Increment counter: {count}</button>
<button on:click={reset}>Reset</button>
