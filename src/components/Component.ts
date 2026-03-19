import { LitElement } from "lit";

export abstract class Component extends LitElement {
  protected createRenderRoot() {
    return this;
  }
}
