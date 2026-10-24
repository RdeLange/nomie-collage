<script lang="ts">
  import { collage } from './store.svelte';
  import { TONES } from './collage/tone';

  const shown = $derived(collage.pictures.slice(0, 4));
  const palette = $derived(TONES[collage.tone]);
</script>

<div class="widget" style="--bg: {palette.background}; --ink: {palette.ink}">
  <div class="widget-head">
    <span>🖼️ Collage</span>
    <span class="muted">{palette.label}</span>
  </div>
  {#if shown.length}
    <div class="mini">
      {#each shown as picture (picture.id)}
        <img src={picture.thumb} alt={picture.title} style="filter: {palette.filter}" />
      {/each}
    </div>
  {:else}
    <p class="muted">Open the plugin to make your first collage.</p>
  {/if}
</div>
