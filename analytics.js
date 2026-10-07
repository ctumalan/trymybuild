// Basic consent mode: no Google request or storage until an explicit choice.
(() => {
  const key = 'cw-analytics-consent'; let config, active = false;
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const set = value => { try { localStorage.setItem(key, value); } catch {} };
  // Only this approved campaign vocabulary is eligible for attribution. Never pass
  // arbitrary query strings, click IDs, search text, or user-supplied UTM values.
  function campaign() {
    const params = new URLSearchParams(location.search);
    if (params.get('utm_source') !== 'youtube' || params.get('utm_medium') !== 'paid_video' || params.get('utm_campaign') !== 'trymybuild_launch') return {};
    const content = params.get('utm_content');
    if (!['guys_talking', 'chalkboard'].includes(content)) return {};
    return {campaign_source:'youtube', campaign_medium:'paid_video', campaign_name:'trymybuild_launch', campaign_content:content};
  }
  window.CWAnalytics = {
    urlAttempt(valid) {
      if (!active || read() !== 'granted' || location.pathname !== '/') return;
      window.gtag?.('event', 'url_submit_attempt', {validation_result:valid === true ? 'valid' : 'invalid_url'});
    }
  };
  function start() {
    if(location.pathname !== '/') return;
    if (active) { window['ga-disable-' + config.measurementId] = false; window.gtag?.('consent','update',{analytics_storage:'granted'}); return; }
    if (!config?.measurementId || read() !== 'granted') return;
    active = true; window['ga-disable-' + config.measurementId] = false; window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('consent', 'default', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    gtag('js', new Date());
    // Exclude query strings, account identity, search text, and dashboard activity.
    gtag('config', config.measurementId, {send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, page_location:location.origin + location.pathname, page_referrer:document.referrer ? new URL(document.referrer).origin : '', ...campaign()});
    gtag('event', 'page_view', {page_location:location.origin + location.pathname, page_title:'TryMyBuild catalog', page_referrer:document.referrer ? new URL(document.referrer).origin : ''});
    const script = document.createElement('script'); script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.measurementId; script.async = true; document.head.append(script);
  }
  function choice() {
    document.querySelector('.analytics-choice')?.remove();
    const panel = document.createElement('section'); panel.className = 'analytics-choice'; panel.setAttribute('aria-label','Analytics preferences');
    panel.innerHTML = '<strong>Help improve TryMyBuild</strong><p>Allow Google Analytics to measure visits, project interest, and app-link submission attempts? Optional analytics stays off until you allow it.</p><button class="secondary-button" data-consent="denied">No thanks</button><button class="primary-button" data-consent="granted">Allow analytics</button><p><a href="/privacy">Privacy details</a></p>';
    panel.addEventListener('click', e => { const value = e.target.closest('[data-consent]')?.dataset.consent; if (!value) return; set(value); panel.remove(); if (value === 'granted') start(); else {
      if (config?.measurementId) window['ga-disable-' + config.measurementId] = true;
      window.gtag?.('consent','update',{analytics_storage:'denied'});
      document.cookie.split(';').forEach(item => { const name = item.trim().split('=')[0]; if (/^_ga(?:_|$)/.test(name)) { document.cookie = name + '=; Max-Age=0; path=/'; document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname; } });
    }});
    document.body.append(panel);
  }
  fetch('/api/analytics-config').then(r => r.json()).then(data => {
    config = data; if (!config.measurementId) return;
    const footer = document.createElement('div'); footer.className = 'privacy-controls'; const button = document.createElement('button'); button.className = 'share-browse-link'; button.textContent = 'Analytics preferences'; button.onclick = choice; footer.append(button); (document.querySelector('.site-footer,.cw-legal-footer')||document.body).append(footer);
    if (!read()) choice(); else start();
  }).catch(() => {});
  document.addEventListener('click', e => {
    if(e.target.closest('[data-analytics-settings]')) { choice(); return; }
    if (!active || read() !== 'granted') return;
    const project = e.target.closest('[data-product], [data-similar-project]');
    if (project) window.gtag?.('event','view_project');
    if (e.target.closest('[data-route="share"]')) window.gtag?.('event','begin_listing');
  });
})();
