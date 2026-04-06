if (!("command" in document.createElement("button"))) {
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
        if (!command.startsWith("--") || !("CommandEvent" in window)) {
          return;
        }

        const CommandEventClass = window.CommandEvent as {
          new (
            type: string,
            init?: {
              bubbles?: boolean;
              cancelable?: boolean;
              composed?: boolean;
              command?: string;
              source?: EventTarget | null;
            },
          ): Event & { command: string; source: EventTarget | null };
        };

        const event = new CommandEventClass("command", {
          bubbles: true,
          cancelable: true,
          composed: true,
          command: command,
          source: btn,
        });

        target.dispatchEvent(event);
        break;
      }
    }
  });
}
