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

  const builtInActions: Record<
    string,
    (target: HTMLElement, btn: HTMLButtonElement) => void
  > = {
    "show-modal": (t) => {
      if (t instanceof HTMLDialogElement) {
        t.showModal();
      }
    },
    "close": (t, btn) => {
      if (t instanceof HTMLDialogElement) {
        t.returnValue = btn.value;
        t.close();
      }
    },
    "request-close": (t, btn) => {
      if (t instanceof HTMLDialogElement) {
        t.returnValue = btn.value;
        t.requestClose();
      }
    },
    "show-popover": (t) => {
      if (t instanceof HTMLElement) {
        t.showPopover();
      }
    },
    "hide-popover": (t) => {
      if (t instanceof HTMLElement) {
        t.hidePopover();
      }
    },
    "toggle-popover": (t) => {
      if (t instanceof HTMLElement) {
        t.togglePopover();
      }
    },
  };

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

    const action = builtInActions[command];
    const isCustom = command.startsWith("--");

    if (action === undefined && !isCustom) {
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

    if (event.defaultPrevented) {
      return;
    }

    action?.(target, btn);
  });
}
