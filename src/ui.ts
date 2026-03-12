import type { MCXCtx } from "@mbler/mcx-types";
import type { MCXUIOpt } from "./types";
import type { Player } from "@minecraft/server";
import type { ActionFormData, ActionFormResponse, MessageFormData, MessageFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
interface ParsedParams extends Omit<MCXUIOpt["layout"][number]["params"], "click"> {
  click: (value: ModalFormResponse | MessageFormData | ActionFormResponse) => void
}
interface ParsedUIOption extends Omit<MCXUIOpt, "layout"> {
  layout: {
    params: ParsedParams;
    content: string | {
      useProp: string
    };
    type: MCXUIOpt["layout"][number]["type"]
  }[];
}
export class ui {
  /*private _nameList: { [key in MCXUIOpt["layout"][number]["type"]]: string | (() => string) } = {
    input: "textField",
    body: "body",
    submit: "submitButton",
    button: "button",
    dropdown: "dropdown",
    toggle: "toggle",
    slider: "slider",
    title: "title",
    divider: "divider",
    "button-m": ((): string => {
      this._msgTemp++;
      return "button" + this._msgTemp;
    })
  }*/
  private _mcUI: typeof import("@minecraft/server-ui");
  private _srcResult: Record<string, any> = {};
  private _UI: MCXUIOpt["use"];
  private _prop: string[];
  private _layout: ParsedUIOption["layout"];
  private _usePropLayoutIndexList: (number)[] = []
  constructor(UIConfig: MCXUIOpt, mcxSrcFn: (ctx: MCXCtx) => any) {
    this._srcResult = mcxSrcFn({});
    this._UI = UIConfig.use;
    if (typeof this._srcResult !== "object") throw new Error("[mcx runtime]: can;t load mcx setup");
    this._prop = this._srcResult.prop || [];
    if (!Array.isArray(this._prop)) throw new Error("[mcx runtime]: can't load prop: invaild prop");
    this._layout = UIConfig.layout.map((i): ParsedUIOption["layout"][number] => {
      if (i.type == "button" && i.params.click) i.params.click = this._srcResult[i.params.click];
      return i as unknown as ParsedUIOption["layout"][number];
    });
    this._mcUI = UIConfig.UI;
    this._init();
  }
  private _init() {
    for (const layoutIndex in this._layout) {
      const layout = this._layout[layoutIndex];
      if (!layout) continue;
      if (typeof layout.content !== "string") {
        if (typeof layout.content?.useProp == "string") {
          this._usePropLayoutIndexList.push(parseInt(layoutIndex))
        } else {
          throw new Error("[mcx runtime]: can't load ui: useProp is not a string")
        }
      }
    }
  }
  private _generateUI(layout: ParsedUIOption["layout"]) {
    let ui = new this._UI();
    let MsgFormUse = 0;
    const clickEvent: Map<number, ParsedParams["click"]> = new Map()
    for (const iIndex in layout) {
      const i = layout[iIndex];
      if (!i) continue;
      if (i.type == "input") {
        (ui as ModalFormData).textField(String(i.content), i.params.placeholderText || "", {
          defaultValue: i.params.default,
          tooltip: i.params.tip
        });
      } else if (i.type == "slider") {
        (ui as ModalFormData).slider(String(i.content), parseFloat(i.params.min) || 0, parseFloat(i.params.max) || 10, {
          tooltip: {
            text: i.params.tip || ""
          }
        })
      } else if (i.type == "toggle") {
        (ui as ModalFormData).toggle(String(i.content), {
          defaultValue: Boolean(i.params.default)
        })
      } else if (i.type == "dropdown") {
        (ui as ModalFormData).dropdown(String(i.content), i.params.option.split(","))
      } else if (i.type == "submit") {
        (ui as ModalFormData).submitButton(String(i.content));
        if (i.params.click) clickEvent.set(0, i.params.click)
      } else if (i.type == "button") {
        (ui as ActionFormData).button(String(i.content), i.params.img || void 0);
        clickEvent.set(parseInt(iIndex), i.params.click)
      } else if (i.type == "body") {
        (ui as ModalFormData | ActionFormData).label(String(i.content))
      } else if (i.type == "divider") {
        (ui as ModalFormData | ActionFormData).divider()
      } else if (i.type == "title") {
        ui.title(String(i))
      } else if (i.type == "button-m") {
        if (MsgFormUse == 0) {
          (ui as MessageFormData).button1(String(i.content));

        }
        else if (MsgFormUse == 1) {
          (ui as MessageFormData).button2(String(i.content));
        } else {
          throw new Error("[mcx runtime]: MessageFormData only can call two")
        }
        if (i.params.click) clickEvent.set(MsgFormUse, i.params.click);
        MsgFormUse++;
      }
    }
    return [ui, clickEvent] as const;
  }
  async show(player: Player, prop: Record<string, string>) {
    const cLayout: typeof this._layout = JSON.parse(JSON.stringify(this._layout))
    for (const propIndex of this._usePropLayoutIndexList) {
      const layout = cLayout[propIndex];
      if (!layout || typeof layout.content !== "object" || !layout.content.useProp) continue;
      layout.content = prop[layout.content.useProp] || ""
    };
    const _temp = this._generateUI(cLayout);
    const ui = _temp[0];
    const promise = ui.show(player);
    const formResponse = await promise;
    if (formResponse.canceled) return;
    if (formResponse instanceof this._mcUI.ActionFormResponse) {
      const clickIndex = formResponse.selection;
      if (!clickIndex) return;
      const handler = _temp[1].get(clickIndex);
      if (handler) handler(formResponse)
    } else if (formResponse instanceof this._mcUI.MessageFormResponse) {
      const p: MessageFormResponse & { selection: number } = formResponse as unknown as MessageFormResponse & { selection: number };
      if (p.selection) {
        const handler = _temp[1].get(p.selection);
        if (handler) handler(formResponse)
      }
    } else if (formResponse instanceof this._mcUI.ModalFormResponse) {
      const handler = _temp[1].get(0);
      if (handler) handler(formResponse);
    }
  }
}