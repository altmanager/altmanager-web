import { html, nothing, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { Component } from "./Component";

@customElement("x-modal")
export class Modal extends Component {
  @property({ type: Object })
  public icon?: TemplateResult;

  @property({ type: String })
  public title: string;

  @property({ type: Object })
  public body?: TemplateResult;

  @property({ type: Array })
  public footer: TemplateResult[] = [];

  @query("dialog")
  public dialog!: HTMLDialogElement;

  public readonly modalId = `modal-${crypto.randomUUID()}`;

  public constructor(
    title: string,
    body?: TemplateResult,
    footer?: TemplateResult[],
    icon?: TemplateResult,
  ) {
    super();
    this.title = title;
    this.body = body;
    this.footer = footer ?? [];
    this.icon = icon;
  }

  public show() {
    return this.dialog.showModal();
  }

  public requestClose() {
    return this.dialog.requestClose();
  }

  public close() {
    return this.dialog.close();
  }

  public override firstUpdated() {
    this.dialog.addEventListener("toggle", (e) => {
      this.dispatchEvent(new ToggleEvent(e.type, e));
    });
  }

  public override render() {
    return html`
      <dialog
        id="${this.modalId}"
        closedby="any"
        aria-labelledby="${this.modalId}-title"
        class="group/modal h-screen w-screen items-end justify-center bg-transparent p-4 text-center backdrop:bg-zinc-900/50 backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-300 backdrop:ease-out open:flex open:backdrop:opacity-100 focus:outline-none sm:items-center sm:p-0 starting:open:backdrop:opacity-0"
      >
        <button
          class="absolute inset-0"
          commandfor="${this.modalId}"
          command="close"
          aria-hidden="true"
          tabindex="-1"
        >
        </button>

        <div
          class="relative translate-y-4 transform overflow-hidden rounded-xl bg-zinc-800 text-left opacity-0 shadow-xl outline -outline-offset-1 outline-white/10 transition-all duration-300 ease-out group-open/modal:translate-y-0 group-open/modal:opacity-100 sm:my-8 sm:w-full sm:max-w-lg sm:translate-y-0 sm:scale-95 group-open/modal:sm:scale-100 starting:group-open/modal:translate-y-4 starting:group-open/modal:opacity-0 starting:group-open/modal:sm:translate-y-0 starting:group-open/modal:sm:scale-95"
        >
          <div
            class="flex flex-col gap-3 px-4 pt-5 pb-4 sm:flex-row sm:items-start sm:gap-4 sm:p-6 sm:pb-6"
          >
            ${this.icon ?? nothing}
            <div class="w-full text-center sm:text-left">
              <h3 id="${this
                .modalId}-title" class="text-base font-semibold text-white">
                ${this.title}
              </h3>
              ${this.body === undefined ? nothing : html`
                <div class="mt-2">${this.body}</div>
              `}
            </div>
          </div>
          ${this.footer.length === 0 ? nothing : html`
            <div class="flex flex-col gap-3 p-6 pt-0 sm:flex-row-reverse sm:px-6 sm:pt-0">
              ${this.footer}
            </div>
          `}
        </div>
      </dialog>
    `;
  }
}
