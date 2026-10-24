<script lang="ts">
  import { collage } from './store.svelte';
  import { TONES } from './collage/tone';

  const shown = $derived(collage.pictures.slice(0, 4));
  // the grid fills the widget: one picture fills it, two sit side by side, three or four make a 2 by 2 grid
  const columns = $derived(shown.length <= 1 ? 1 : 2);
  const rows = $derived(Math.max(1, Math.ceil(shown.length / columns)));
  const palette = $derived(TONES[collage.tone]);
</script>

<div class="widget" style="--bg: {palette.background}; --ink: {palette.ink}">
  <div class="widget-head">
    <span>🖼️ Collage</span>
    <span class="muted">{palette.label}</span>
  </div>
  {#if shown.length}
    <div class="mini" style="grid-template-columns: repeat({columns}, 1fr); grid-template-rows: repeat({rows}, 1fr);">
      {#each shown as picture (picture.id)}
        <img src={picture.thumb} alt={picture.title} style="filter: {palette.filter}" />
      {/each}
    </div>
  {:else}
    <p class="muted">Open the plugin to make your first collage.</p>
  {/if}
</div>
