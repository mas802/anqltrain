import { trainInfo,trainToggle } from "../control/StartControl.js";

const sleep = m => new Promise(r => setTimeout(r, m))
const YT_AUTOPLAY_QUERY = 'autoplay=1&playsinline=1';
const DEFAULT_VIDEO_MODE = 'landscape';
const SHORTS_VIDEO_MODE = 'shorts';

class StartView extends HTMLElement {

  constructor() {
    super();
    console.log("start view loaded");

    this.count = 0;
    this.state = "load";
    this.label = this.getAttribute('data-label');
    this.youtube = null;
    this.token = this.extractTokenFromLocation();
    this.tokenMaxAgeSeconds = 10 * 60;
    this.expiredToken = false;
const html = `<style>
:host {
    display: inline-block;
    position: relative;
}

img {
    max-width: 100%;
    width: 1000px;
    display: block;
    position: relative;
    z-index: 1;
    cursor: pointer;
}

.img-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10pt;
    color: #fff;
    text-transform: uppercase;
    white-space: nowrap;
    z-index: 0;
}

</style>
<span class="img-label" id="label">${this.label}</span>
<img src="/imgs/${this.label}_${this.state}.jpg" id="start" alt="${this.label}" />`;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `${html}`;

    this.buttonStart = this.shadowRoot.getElementById('start');
    this.labelStart = this.shadowRoot.getElementById('label');

    this.action = this.action.bind(this);
    this.handleImageError = this.handleImageError.bind(this);
    this.handleImageLoad = this.handleImageLoad.bind(this);
    this.openOverlay = this.openOverlay.bind(this);
    this.closeOverlay = this.closeOverlay.bind(this);
    this.lastImageWasAdvent = false;
    this.retryAdventImageOnce = false;

    this.ele = this;
  }


  update() {
    const renderData = this.buildRenderData();
    this.buttonStart.hidden = false;
    this.buttonStart.src = renderData.imagePath;
    this.labelStart.textContent = renderData.labelText;
    this.lastImageWasAdvent = renderData.isAdventState;
    this.retryAdventImageOnce = false;
  }

  buildRenderData(options = {}) {
    const normalizedLabel = (this.label || '').trim().toUpperCase();
    const normalizedState = (this.state ?? 'load').toString().trim() || 'load';
    const upperState = normalizedState.toUpperCase();
    const isAdventState = upperState.startsWith('ADVENT_');
    let imagePath = isAdventState
      ? `/imgs/${upperState}.jpg`
      : `/imgs/${normalizedLabel}_${normalizedState}.jpg`;

    if (options.cacheBust && isAdventState) {
      const separator = imagePath.includes('?') ? '&' : '?';
      imagePath = `${imagePath}${separator}_=${Date.now()}`;
    }
    const absolutePath = StartView.resolveAssetUrl(imagePath);
    const labelText = isAdventState ? upperState : `${normalizedLabel}:${normalizedState}`;
    return { imagePath: absolutePath, labelText, isAdventState };
  }

  handleImageError() {
    if (this.lastImageWasAdvent && !this.retryAdventImageOnce) {
      this.retryAdventImageOnce = true;
      const retryData = this.buildRenderData({ cacheBust: true });
      this.buttonStart.src = retryData.imagePath;
      return;
    }
    this.buttonStart.src = StartView.resolveAssetUrl('/imgs/TRANSPARENT.png');
  }

  handleImageLoad() {
    this.buttonStart.hidden = false;
  }

  updateYoutubeFromResult(result) {
    if (!result || typeof result !== 'object') {
        this.youtube = null;
        return;
    }
    this.youtube = result.data ? result.data : null;
  }

  async infoCallback() {
    var result = [];
    result = await trainInfo(this.label, this.token);
    console.log([Date.now() + " info ", result])
    this.state = result.state;
    this.updateYoutubeFromResult(result);
    this.update();

    if ( result.state === "load" && result.until > 0 ) {
        await sleep(result.until);
        await this.infoCallback();
    }
  }

  async action(event) {
    if (this.youtube) {
        event?.preventDefault();
        this.openOverlay();
        return;
    }
    this.state = "load";
    this.update();

    var result = [];
    console.log("perform action");
    result = await trainToggle(this.label, this.token);

    this.state = result.state;
    this.updateYoutubeFromResult(result);
    this.update();

    if ( result.until > 0 ) {
        await sleep(result.until);
        await this.infoCallback();
    }
  }

  connectedCallback() {
    console.log(Date.now() + " toggelt")
    console.log("start view connected callback");
    this.buttonStart.addEventListener('click', this.action);
    this.buttonStart.addEventListener('error', this.handleImageError);
    this.buttonStart.addEventListener('load', this.handleImageLoad);
    this.infoCallback();
  }

  disconnectedCallback() {
    this.buttonStart?.removeEventListener('click', this.action);
    this.buttonStart?.removeEventListener('error', this.handleImageError);
    this.buttonStart?.removeEventListener('load', this.handleImageLoad);
  }

  buildYouTubeEmbedUrl(urlOrId, modeHint = SHORTS_VIDEO_MODE) {
    if (!urlOrId) {
        return null;
    }
    const resolvedMode = modeHint || StartView.detectYoutubeMode(urlOrId);
    const queryTail = resolvedMode === SHORTS_VIDEO_MODE
        ? `${YT_AUTOPLAY_QUERY}&feature=shorts`
        : `${YT_AUTOPLAY_QUERY}&rel=0`;
    const buildUrl = id => `https://www.youtube.com/embed/${id}?${queryTail}`;
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
        return buildUrl(urlOrId);
    }
    try {
        const baseOrigin = (typeof window !== 'undefined' && window.location)
            ? window.location.origin
            : 'https://www.youtube.com';
        const parsed = new URL(urlOrId, baseOrigin);
        if (parsed.hostname.includes('youtu.be')) {
            const id = parsed.pathname.replace('/', '');
            return id ? buildUrl(id) : null;
        }
        if (parsed.hostname.includes('youtube.com')) {
            const pathname = parsed.pathname || '';
            if (pathname.toLowerCase().startsWith('/shorts/')) {
                const id = pathname.split('/').filter(Boolean).pop();
                return id ? buildUrl(id) : null;
            }
            const id = parsed.searchParams.get('v');
            if (id) {
                return buildUrl(id);
            }
        }
    } catch (e) {
        return null;
    }
    return null;
  }

  openOverlay() {
    const mode = this.getYoutubeDisplayMode();
    const embedUrl = this.buildYouTubeEmbedUrl(this.youtube, mode);
    if (!embedUrl) {
        return;
    }
    StartView.openGlobalOverlay(embedUrl, mode);
  }

  closeOverlay() {
    StartView.closeGlobalOverlay();
  }

  static injectOverlayStyles() {
    if (StartView.overlayStylesInjected || typeof document === 'undefined') {
        return;
    }
    const style = document.createElement('style');
    style.textContent = `
.startview-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.85);
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease-in-out;
}

.startview-overlay.open {
    opacity: 1;
    pointer-events: all;
}

.startview-overlay__content {
    position: relative;
    width: min(90vw, 1280px);
    max-height: 90vh;
}

.startview-overlay__frame {
    width: 100%;
    aspect-ratio: 16/9;
    border: none;
    background: #000;
    max-height: 90vh;
}

.startview-overlay__close {
    position: absolute;
    top: -2.5rem;
    right: 0;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
}

.startview-overlay--shorts .startview-overlay__content {
    width: min(70vw, 480px);
}

.startview-overlay--shorts .startview-overlay__frame {
    aspect-ratio: 9/16;
    max-height: 85vh;
}
`;
    document.head.appendChild(style);
    StartView.overlayStylesInjected = true;
  }

  static ensureOverlayResources() {
    if (StartView.overlayElements || typeof document === 'undefined') {
        return StartView.overlayElements;
    }
    StartView.injectOverlayStyles();
    const overlay = document.createElement('div');
    overlay.className = 'startview-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
  <div class="startview-overlay__content">
    <button type="button" class="startview-overlay__close" aria-label="Close video">&times;</button>
    <iframe class="startview-overlay__frame" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen playsinline></iframe>
  </div>
`;
    document.body.appendChild(overlay);
    const frame = overlay.querySelector('iframe');
    const closeButton = overlay.querySelector('.startview-overlay__close');
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            StartView.closeGlobalOverlay();
        }
    });
    closeButton.addEventListener('click', () => StartView.closeGlobalOverlay());
    StartView.overlayKeydownHandler = event => {
        if (event.key === 'Escape') {
            StartView.closeGlobalOverlay();
        }
    };
    StartView.overlayElements = { overlay, frame };
    return StartView.overlayElements;
  }

  static openGlobalOverlay(embedUrl, mode = DEFAULT_VIDEO_MODE) {
    const elements = StartView.ensureOverlayResources();
    if (!elements) {
        return;
    }
    const isShorts = mode === SHORTS_VIDEO_MODE;
    elements.overlay.classList.toggle('startview-overlay--shorts', isShorts);
    elements.frame.src = embedUrl;
    elements.overlay.hidden = false;
    requestAnimationFrame(() => {
        elements.overlay.classList.add('open');
    });
    document.addEventListener('keydown', StartView.overlayKeydownHandler);
  }

  static closeGlobalOverlay() {
    const elements = StartView.overlayElements;
    if (!elements) {
        return;
    }
    elements.overlay.classList.remove('open');
    elements.overlay.hidden = true;
    elements.overlay.classList.remove('startview-overlay--shorts');
    elements.frame.src = '';
    document.removeEventListener('keydown', StartView.overlayKeydownHandler);
  }

  static resolveAssetUrl(path) {
    if (typeof window === 'undefined' || !window.location) {
        return path;
    }
    try {
        return new URL(path, window.location.origin).href;
    } catch (e) {
        return path;
    }
  }

  getYoutubeDisplayMode() {
    const attrMode = (this.getAttribute('data-youtube-mode') || this.getAttribute('youtube-mode') || '')
        .trim()
        .toLowerCase();
    if (attrMode === SHORTS_VIDEO_MODE || attrMode === DEFAULT_VIDEO_MODE) {
        return attrMode;
    }
    return StartView.detectYoutubeMode(this.youtube);
  }

  static detectYoutubeMode(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string') {
        return DEFAULT_VIDEO_MODE;
    }
    const lower = urlOrId.toLowerCase();
    if (lower.includes('/shorts/')) {
        return SHORTS_VIDEO_MODE;
    }
    try {
        const baseOrigin = (typeof window !== 'undefined' && window.location)
            ? window.location.origin
            : 'https://www.youtube.com';
        const parsed = new URL(urlOrId, baseOrigin);
        if ((parsed.pathname || '').toLowerCase().includes('/shorts/')) {
            return SHORTS_VIDEO_MODE;
        }
    } catch (e) {
        // ignore invalid URLs
    }
    return DEFAULT_VIDEO_MODE;
  }

  extractTokenFromLocation() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    } catch (e) {
        return null;
    }
  }

  isTokenExpired() {
    if (this.expiredToken) {
        return true;
    }
    if (!this.token) {
        return false;
    }
    const parsed = Number(this.token);
    if (!Number.isFinite(parsed)) {
        return true;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    return (nowSeconds - parsed) > this.tokenMaxAgeSeconds;
  }
}

StartView.overlayElements = null;
StartView.overlayStylesInjected = false;
StartView.overlayKeydownHandler = null;

customElements.define('xmas-start', StartView);
