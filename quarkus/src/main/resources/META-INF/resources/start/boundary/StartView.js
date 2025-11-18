import { trainInfo,trainToggle } from "../control/StartControl.js";

const sleep = m => new Promise(r => setTimeout(r, m))

class StartView extends HTMLElement {

  constructor() {
    super();
    console.log("start view loaded");

    this.count = 0;
    this.state = "load";
    this.label = this.getAttribute('data-label');
    this.youtube = this.getAttribute('youtube') || this.getAttribute('data-youtube');
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

.overlay {
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

.overlay.open {
    opacity: 1;
    pointer-events: all;
}

.overlay .overlay-content {
    position: relative;
    width: min(90vw, 1280px);
}

.overlay iframe {
    width: 100%;
    aspect-ratio: 16/9;
    border: none;
    background: #000;
}

.overlay button.close {
    position: absolute;
    top: -2.5rem;
    right: 0;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
}

</style>
<div class="overlay" id="videoOverlay" hidden>
  <div class="overlay-content">
    <button class="close" id="closeOverlay" aria-label="Close video">&times;</button>
    <iframe id="youtubeFrame" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
</div>
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
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.handleOverlayKeydown = this.handleOverlayKeydown.bind(this);

    this.ele = this;
  }


  update() {
    this.buttonStart.hidden = false;
    const isAdventState = this.state.startsWith('ADVENT_');
    const imagePath = isAdventState
      ? `/imgs/${this.state}.jpg`
      : `/imgs/${this.label}_${this.state}.jpg`;
    this.buttonStart.src = imagePath;
    this.labelStart.textContent = isAdventState ? this.state : `${this.label}:${this.state}`;
  }

  handleImageError() {
    this.buttonStart.src=`/imgs/TRANSPARENT.png`;
  }

  handleImageLoad() {
    this.buttonStart.hidden = false;
  }

  async infoCallback() {
    if (this.isTokenExpired()) {
        this.handleExpiredToken();
        return;
    }
    var result = [];
    result = await trainInfo(this.label, this.token);
    console.log(Date.now() + " info " + result)
    this.state = result.state;
    this.update();

    if ( result.state === "load" && result.until > 0 ) {
        await sleep(result.until);
        await this.infoCallback();
    }
  }

  async action(event) {
    if (this.isTokenExpired()) {
        this.handleExpiredToken();
        return;
    }
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
    this.overlay = this.shadowRoot.getElementById('videoOverlay');
    this.overlayClose = this.shadowRoot.getElementById('closeOverlay');
    this.youtubeFrame = this.shadowRoot.getElementById('youtubeFrame');
    if (this.overlay && this.overlayClose) {
        this.overlay.addEventListener('click', this.handleOverlayClick);
        this.overlayClose.addEventListener('click', this.closeOverlay);
    }
    this.infoCallback();
  }

  disconnectedCallback() {
    this.buttonStart?.removeEventListener('click', this.action);
    this.buttonStart?.removeEventListener('error', this.handleImageError);
    this.buttonStart?.removeEventListener('load', this.handleImageLoad);
    this.overlay?.removeEventListener('click', this.handleOverlayClick);
    this.overlayClose?.removeEventListener('click', this.closeOverlay);
    window.removeEventListener('keydown', this.handleOverlayKeydown);
  }

  handleOverlayClick(event) {
    if (event.target === this.overlay) {
        this.closeOverlay();
    }
  }

  handleOverlayKeydown(event) {
    if (event.key === 'Escape') {
        this.closeOverlay();
    }
  }

  buildYouTubeEmbedUrl(urlOrId) {
    if (!urlOrId) {
        return null;
    }
    // Support raw IDs and URLs.
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
        return `https://www.youtube.com/embed/${urlOrId}?autoplay=1`;
    }
    try {
        const parsed = new URL(urlOrId, window.location.origin);
        if (parsed.hostname.includes('youtu.be')) {
            const id = parsed.pathname.replace('/', '');
            return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
        }
        if (parsed.hostname.includes('youtube.com')) {
            const id = parsed.searchParams.get('v');
            if (id) {
                return `https://www.youtube.com/embed/${id}?autoplay=1`;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
  }

  openOverlay() {
    const embedUrl = this.buildYouTubeEmbedUrl(this.youtube);
    if (!embedUrl || !this.overlay || !this.youtubeFrame) {
        return;
    }
    this.youtubeFrame.src = embedUrl;
    this.overlay.hidden = false;
    requestAnimationFrame(() => {
        this.overlay.classList.add('open');
    });
    window.addEventListener('keydown', this.handleOverlayKeydown);
  }

  closeOverlay() {
    if (!this.overlay || !this.youtubeFrame) {
        return;
    }
    this.overlay.classList.remove('open');
    this.overlay.hidden = true;
    this.youtubeFrame.src = '';
    window.removeEventListener('keydown', this.handleOverlayKeydown);
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

  handleExpiredToken() {
    this.expiredToken = true;
    this.state = "YOUTUBE";
    this.update();
  }

}

customElements.define('xmas-start', StartView);
