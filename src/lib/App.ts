import { EventOpt, MCXCtx, MCXFile } from "@mbler/mcx-types";
import { Event } from "./../event"
import { type World } from "@minecraft/server";
export class App {
  constructor(public app: MCXFile<"app">) {
    if (this.app.type !== "app") throw new Error("[createApp]: can't resolve not app mcx");

  }
  private _loadEventMCX(eMCX: MCXFile<"event">): Event {
    const setupResult = this._exec_setup(eMCX.setup, {});
    if (!eMCX.app.event) throw new TypeError("[mcx runtime]: Can't load event: don't have event")
    const eventOpt: EventOpt = eMCX.app.event as unknown as EventOpt;
    for (const index of Object.entries(eMCX.app.event.data)) {
      if (typeof index[1] !== "string" || typeof setupResult[index[1]] !== "function") throw new Error("[mcx runtime]: Can't load subscribe: don't load handler for " + index[0]);
      eventOpt.data[index[0]] = setupResult[index[1]];
    }
    return new Event(eventOpt, (mcx) => this._loadEventMCX(mcx))
  }
  private _exec_setup(MCXSetup: (ctx: MCXCtx) => any, opt: MCXCtx): Record<string, any> {
    const ctx: MCXCtx = opt;
    const response = MCXSetup(ctx);
    if (typeof response !== "object") {
      throw new TypeError("[mcx runtime]: can't exec setup: setup response is not object")
    }
    return response;
  }
  public mount(world: World) {
    const ctx: MCXCtx = {}
    if (this.app.app.event) {
      for (const eventMCX of this.app.app.event) {
        if (!ctx.event) ctx.event = [];
        const event = this._loadEventMCX(eventMCX);
        event.useWorld(world)
        ctx.event.push(event)
      }
    };
    this._exec_setup(this.app.setup, ctx)
  }
}