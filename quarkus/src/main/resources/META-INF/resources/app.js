import './start/boundary/StartView.js'

const AUDIO_PREFIX = 'AUDIO_';

const initAudioTriggers = () => {
  const componentByLabel = new Map();
  document.querySelectorAll('xmas-start[data-label]').forEach(component => {
    const label = component.getAttribute('data-label');
    if (!label) {
      return;
    }
    const normalized = label.trim().toUpperCase();
    const items = componentByLabel.get(normalized);
    if (items) {
      items.push(component);
    } else {
      componentByLabel.set(normalized, [component]);
    }
  });

  if (!componentByLabel.size) {
    return;
  }

  document.querySelectorAll(`audio[id^="${AUDIO_PREFIX}"]`).forEach(audio => {
    const id = audio.id || '';
    const label = id.substring(AUDIO_PREFIX.length).toUpperCase();
    const targets = componentByLabel.get(label);
    if (!targets || !targets.length) {
      return;
    }
    targets.forEach(target => {
      target.addEventListener('click', () => {
        audio.currentTime = 0;
        audio.play();
      });
    });
  });
};

const propagateTokenToPlanLinks = () => {
  const links = document.querySelectorAll('.plan-link[href]');
  if (!links.length) {
    return;
  }
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
    return;
  }
  links.forEach(link => {
    const target = new URL(link.href);
    target.searchParams.set('token', token);
    link.href = target.toString();
  });
};

const boot = () => {
  initAudioTriggers();
  propagateTokenToPlanLinks();
  console.log('xmas loaded');
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
