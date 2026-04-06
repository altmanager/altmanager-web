if (!("command" in document.createElement("button"))) {
  interface InvokerCommand {
    command: string;
    source: HTMLButtonElement | null;
  }

  interface CommandEventInit extends EventInit, Partial<InvokerCommand> {}

  interface InvokerCommandEvent extends Event, InvokerCommand {}

  interface CommandEventConstructor {
    new (type: string, init?: CommandEventInit): InvokerCommandEvent;
  }

  const polyfillWindow = window as typeof window & {
    CommandEvent: CommandEventConstructor;
  };

  if (!("CommandEvent" in window)) {
    class CommandEvent extends Event implements InvokerCommandEvent {
      public readonly command: string;
      public readonly source: HTMLButtonElement | null;

      public constructor(type: string, init: CommandEventInit = {}) {
        super(type, init);
        this.command = init.command ?? "";
        this.source = init.source ?? null;
      }
    }

    polyfillWindow.CommandEvent = CommandEvent;
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) {
      return;
    }

    const btn = e.target.closest<HTMLButtonElement>("button");

    if (btn === null) {
      return;
    }

    const command = btn.getAttribute("command");
    const commandFor = btn.getAttribute("commandfor");
    if (command === null || commandFor === null) {
      return;
    }

    const target = document.getElementById(commandFor);
    if (target === null) {
      return;
    }

    switch (command) {
      case "show-modal": {
        if (target instanceof HTMLDialogElement) {
          target.showModal();
        }
        break;
      }
      case "close": {
        if (target instanceof HTMLDialogElement) {
          target.returnValue = btn.value;
          target.close();
        }
        break;
      }
      case "request-close": {
        if (target instanceof HTMLDialogElement) {
          target.returnValue = btn.value;
          target.requestClose();
        }
        break;
      }
      case "show-popover": {
        if (target instanceof HTMLElement) {
          target.showPopover();
        }
        break;
      }
      case "hide-popover": {
        if (target instanceof HTMLElement) {
          target.hidePopover();
        }
        break;
      }
      case "toggle-popover": {
        if (target instanceof HTMLElement) {
          target.togglePopover();
        }
        break;
      }
      default: {
        if (!command.startsWith("--")) {
          return;
        }

        const event = new polyfillWindow.CommandEvent("command", {
          bubbles: true,
          cancelable: true,
          composed: true,
          command,
          source: btn,
        });

        target.dispatchEvent(event);
        break;
      }
    }
  });
}
