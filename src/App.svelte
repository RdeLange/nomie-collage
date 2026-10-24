<script lang="ts">
  import { collage } from './store.svelte';
  import Widget from './Widget.svelte';
  import { build, categoryOptions, openCredit, saveToTimeline, setSettings } from './nomie';
  import { CATEGORIES, type CategoryId, type SourceChoice } from './collage/sources';
  import { TONES, TONE_IDS, type ToneId } from './collage/tone';
  import { tileRatio, seededRandom } from './collage/layout';

  let newWord = $state('');
  const sources: Array<[SourceChoice, string]> = [
    ['mixed', 'Both'],
    ['openverse', 'Openverse'],
    ['commons', 'Wikimedia'],
  ];
  const counts = [12, 24, 36];

  const tone = $derived(collage.settings.tone === 'auto' ? collage.tone : (collage.settings.tone as ToneId));
  const palette = $derived(TONES[tone]);
  const dark = $derived(palette.background === '#1C1C1E' || collage.theme === 'dark');

  // Each tile gets its height from the seed, so the collage is not a plain grid
  const ratios = $derived.by(() => {
    const random = seededRandom(collage.seed);
    return collage.pictures.map(() => tileRatio(random));
  });

  const addWord = () => {
    const word = newWord.trim();
    if (!word) return;
    setSettings({ added: [...collage.settings.added.filter((w) => w !== word.toLowerCase()), word.toLowerCase()] });
    newWord = '';
  };

  // Removing a word: a found word goes on the removed list, a typed one leaves the added list
  const removeWord = (word: string) => {
    if (collage.settings.added.includes(word)) {
      setSettings({ added: collage.settings.added.filter((w) => w !== word) });
    } else {
      setSettings({ removed: [...collage.settings.removed, word] });
    }
  };

  const words = $derived(
    [...collage.settings.added, ...collage.found.filter((w) => !collage.settings.removed.includes(w) && !collage.settings.added.includes(w))].slice(0, 6)
  );
</script>

{#if collage.mode === 'widget'}
  <Widget />
{:else}
  <main class="page" class:dark data-tone={tone} style="--bg: {palette.background}; --ink: {palette.ink}">
    <header class="top">
      <h1>Collage</h1>
      <span class="muted">{palette.label} · {collage.pictures.length} pictures</span>
    </header>

    <section class="card">
      <p class="label">Words</p>
      <div class="chips">
        {#each words as word (word)}
          <span class="chip">
            {word}
            <button class="x" aria-label="Remove {word}" onclick={() => removeWord(word)}>×</button>
          </span>
        {:else}
          <span class="muted">No words yet. Write some notes, or add a word below.</span>
        {/each}
      </div>
      <div class="row">
        <input class="input" placeholder="Add a word" bind:value={newWord} onkeydown={(e) => e.key === 'Enter' && addWord()} />
        <button class="btn" onclick={addWord}>Add</button>
      </div>
    </section>

    <section class="card">
      <p class="label">Picture type</p>
      <div class="segments">
        {#each categoryOptions as id (id)}
          <button class="seg" class:on={collage.settings.category === id} onclick={() => setSettings({ category: id as CategoryId })}>
            {CATEGORIES[id as CategoryId].label}
          </button>
        {/each}
      </div>
      <p class="label" style="margin-top: 12px">Where from</p>
      <div class="segments">
        {#each sources as [id, label] (id)}
          <button class="seg" class:on={collage.settings.source === id} onclick={() => setSettings({ source: id })}>{label}</button>
        {/each}
      </div>
    </section>

    <section class="card">
      <p class="label">Mood of the collage</p>
      <div class="segments">
        <button class="seg" class:on={collage.settings.tone === 'auto'} onclick={() => setSettings({ tone: 'auto' })}>From my mood</button>
        {#each TONE_IDS as id (id)}
          <button class="seg" class:on={collage.settings.tone === id} onclick={() => setSettings({ tone: id })}>{TONES[id].label}</button>
        {/each}
      </div>
      <p class="label" style="margin-top: 12px">Pictures</p>
      <div class="segments">
        {#each counts as n (n)}
          <button class="seg" class:on={collage.settings.count === n} onclick={() => setSettings({ count: n })}>{n}</button>
        {/each}
      </div>
    </section>

    <div class="actions">
      <button class="btn primary" onclick={() => build(false)} disabled={collage.status === 'loading'}>
        {collage.pictures.length ? 'New collage' : 'Make collage'}
      </button>
      <button class="btn" onclick={() => build(true)} disabled={!collage.pictures.length || collage.status === 'loading'}>Shuffle</button>
      <button class="btn" onclick={saveToTimeline} disabled={!collage.pictures.length}>Save to timeline</button>
    </div>

    {#if collage.status === 'loading'}
      <p class="muted center">Finding pictures…</p>
    {/if}
    {#if collage.message}
      <p class="notice">{collage.message}</p>
    {/if}

    <section class="board" aria-label="Collage">
      {#each collage.pictures as picture, i (picture.id)}
        <figure class="tile" style="aspect-ratio: {ratios[i]}">
          <img src={picture.thumb} alt={picture.title} loading="lazy" style="filter: {palette.filter}" />
          <figcaption>
            <span>{picture.creator}</span>
            <button class="credit" onclick={() => openCredit(picture)}>{picture.license}</button>
          </figcaption>
        </figure>
      {/each}
    </section>

    {#if collage.pictures.length}
      <section class="card credits">
        <p class="label">Credits</p>
        {#each collage.pictures as picture (picture.id)}
          <p class="credit-line">
            <button class="link" onclick={() => openCredit(picture)}>{picture.title}</button>
            by {picture.creator}, {picture.license}
          </p>
        {/each}
      </section>
    {/if}
  </main>
{/if}
