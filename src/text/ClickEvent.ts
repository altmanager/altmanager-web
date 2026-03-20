import { ClickAction } from "./ClickAction";

export type ClickEvent =
  | { action: ClickAction.OPEN_URL; url: string }
  | { action: ClickAction.OPEN_FILE; file: string }
  | { action: ClickAction.RUN_COMMAND; command: string }
  | { action: ClickAction.SUGGEST_COMMAND; command: string }
  | { action: ClickAction.CHANGE_PAGE; page: number }
  | { action: ClickAction.COPY_TO_CLIPBOARD; value: string }
  | { action: ClickAction.SHOW_DIALOG; dialog: string | object }
  | { action: ClickAction.CUSTOM; id: string; payload?: string | object };
