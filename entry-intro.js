(() => {
  const key = 'trymybuild-entry-intro-seen';
  const duration = 4200;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let finished = false, startedAt = null, field = null, overlay = null, timer = null, observer = null;
  try { finished = sessionStorage.getItem(key) === '1'; } catch {}

  function cleanup() {
    clearTimeout(timer);
    observer?.disconnect();
    observer = null;
    overlay?.remove();
    field?.classList.remove('is-introducing');
    overlay = field = null;
  }
  function stop() {
    finished = true;
    try { sessionStorage.setItem(key, '1'); } catch {}
    cleanup();
  }
  function fits() {
    return overlay && overlay.clientWidth > 0 &&
      [...overlay.children].every(line => line.scrollWidth <= overlay.clientWidth);
  }
  function mount(root = document) {
    cleanup();
    if (finished) return;
    const box = root.querySelector('.discovery-entry-field');
    const input = box?.querySelector('input');
    if (!input) { if (startedAt !== null) stop(); return; }
    if (motion.matches || input.value || document.activeElement === input) { stop(); return; }
    if (document.hidden) return;
    const elapsed = startedAt === null ? 0 : Date.now() - startedAt;
    if (elapsed >= duration) { stop(); return; }
    field = box;
    overlay = document.createElement('span');
    overlay.className = 'entry-intro';
    overlay.setAttribute('aria-hidden', 'true');
    for (const text of ['Share what you are building.', 'Find apps that make life easier.']) {
      const line = document.createElement('span');
      line.textContent = text;
      line.style.animationDelay = `-${elapsed}ms`;
      overlay.append(line);
    }
    field.append(overlay);
    if (!fits()) { stop(); return; }
    startedAt ??= Date.now();
    try { sessionStorage.setItem(key, '1'); } catch {}
    field.classList.add('is-introducing');
    timer = setTimeout(stop, duration - elapsed);
    observer = new ResizeObserver(() => { if (!fits()) stop(); });
    observer.observe(field);
  }
  // The animation is decorative; it never changes the input's value, label or placeholder.
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
