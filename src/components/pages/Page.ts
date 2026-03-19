import { Component } from "../Component";
import { Match } from "navigo";

export abstract class Page extends Component {
  readonly #route: string;

  protected constructor(route: string) {
    super();
    this.#route = route;
  }

  public get route() {
    return this.#route;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.tabIndex = -1;
    this.classList.add("focus:outline-none");
  }

  public onOpen(match?: Match) {
    this.focusPage();
  }

  private focusPage() {
    this.updateComplete.then(() => {
      super.focus();
    });
  }
}
