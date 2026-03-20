import { LitElement } from "lit";

export abstract class Component extends LitElement {
  protected override createRenderRoot() {
    return this;
  }
}
