import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./Component";
import { Page } from "./pages/Page";
import { WsClient } from "../api/WsClient";
import Navigo from "navigo";
import { HomePage } from "./pages/HomePage";

@customElement("app-root")
export class AppRoot extends Component {
  @state()
  private page!: Page;

  private readonly api: WsClient;
  private readonly router = new Navigo("/");

  public constructor(api: WsClient) {
    super();
    this.api = api;
    window.app = this;
  }

  public override async connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", (e) => {
      if (!(e.target instanceof Element)) {
        return;
      }
      const target = e.target.closest("a");
      if (target === null) {
        return;
      }

      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      e.preventDefault();
      this.router.navigate(url.pathname);
    });

    const pages = [
      new HomePage(this.api),
    ];

    for (const page of pages) {
      this.router.on(page.route, (match) => {
        this.page = page;
        this.page.onOpen(match);
      });
    }

    this.router.resolve();
  }

  public override render() {
    return html`
      <div class="mx-auto max-w-2xl px-2 py-8">
        ${this.page}
      </div>
    `;
  }
}
