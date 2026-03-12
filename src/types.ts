import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui"
export interface MCXUIOpt {
  layout: {
    type: "input" | "dropdown" | "submit" | "toggle" | "slider" | "button-m" | "button" | "divider" | "title" | "body";
    params: {
      [key in "click" | "default" | "option" | "min" | "max" | "placeholderText" | "tip" | "img"]: string
    };
    content: string | {
      useProp: string
    }
  }[];
  use: typeof ModalFormData | typeof MessageFormData | typeof ActionFormData;
  UI: typeof import("@minecraft/server-ui")
};
