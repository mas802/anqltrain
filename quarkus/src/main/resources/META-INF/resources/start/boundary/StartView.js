import { trainInfo,trainToggle } from "../control/StartControl.js";

const sleep = m => new Promise(r => setTimeout(r, m))

class StartView extends HTMLElement {

  constructor() {
    super();
    console.log("start view loaded");

    this.count = 0;
    this.state = "load";
    this.label = this.getAttribute('data-label');
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

    this.ele = this;
  }


  update() {
    this.buttonStart.hidden = false;
    this.buttonStart.src=`/imgs/${this.label}_${this.state}.jpg`;
    this.labelStart.textContent = `${this.label}:${this.state}`;
  }

  handleImageError() {
    this.buttonStart.src=`/imgs/TRANSPARENT.png`;
  }

  handleImageLoad() {
    this.buttonStart.hidden = false;
  }

  async infoCallback() {
    var result = [];
    result = await trainInfo(this.label);
    console.log(Date.now() + " info " + result)
    this.state = result.state;
    this.update();

    if ( result.state === "load" && result.until > 0 ) {
        await sleep(result.until);
        await this.infoCallback();
    }
  }

  async action() {
    this.state = "load";
    this.update();

    var result = [];
    console.log("perform action");
    result = await trainToggle(this.label);

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
    this.infoCallback();
  }

}

customElements.define('xmas-start', StartView);
