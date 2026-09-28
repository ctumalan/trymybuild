(() => {
  const key = 'trymybuild-discovery-intro-seen';
  const duration = 1800;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let finished = false, startedAt = null, timer = null;
  try { finished = sessionStorage.getItem(key) === '1'; } catch {}

  function stop() {
    finished = true;
    clearTimeout(timer);
    document.querySelector('.discovery-promise')?.classList.remove('is-introducing');
    try { sessionStorage.setItem(key, '1'); } catch {}
  }
  let promptObserver = null;
  function mountPrompt(root) {
    promptObserver?.disconnect();
    const prompt = root.querySelector('.entry-placeholder');
    const track = prompt?.querySelector('.entry-placeholder-track');
    if (!track?.style) return;
    const measure = () => {
      const distance = Math.max(0, track.scrollWidth - prompt.clientWidth);
      track.style.setProperty('--entry-travel', `-${distance}px`);
      // About 28 pixels per second, with a reading pause at each end.
      track.style.setProperty('--entry-duration', `${Math.max(12, distance / 28 + 4)}s`);
      prompt.classList.toggle('is-scrolling', distance > 0);
    };
    measure();
    promptObserver = new ResizeObserver(measure);
    promptObserver.observe(prompt);
    if (document.fonts) document.fonts.ready.then(() => { if (prompt.isConnected) measure(); });
  }
  function mount(root = document) {
    mountPrompt(root);
    const brand = document.querySelector('.discovery-promise');
    if (!brand || finished || startedAt !== null) return;
    if (motion.matches) { stop(); return; }
    if (document.hidden) return;
    startedAt = Date.now();
    brand.classList.add('is-introducing');
    try { sessionStorage.setItem(key, '1'); } catch {}
    timer = setTimeout(stop, duration);
  }
  // The promise reveals once above the search instructions, then stays visible.
  for (const type of ['pointerdown', 'focusin', 'keydown', 'input', 'change', 'click']) {
    document.addEventListener(type, event => {
      if (event.target.closest?.('[data-discovery-entry]')) stop();
    }, true);
  }
  motion.addEventListener('change', event => { if (event.matches) stop(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && startedAt !== null) stop();
    else if (!document.hidden) mount();
  });
  window.CWEntryIntro = { mount };
})();
