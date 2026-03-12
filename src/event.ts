import {
  type World,
  world,
  type WorldAfterEvents,
  type WorldBeforeEvents,
} from "@minecraft/server";
import { EventOpt, MCXFile } from "@mbler/mcx-types";
import { generateAntiShake } from "./lib/Utils";
let _world = world;
interface BindResponse {
  code: number;
  msg: string;
}
class EventStatus {
  run: string[] = [];
  all: Record<string, (event: any) => void> = {};
  runCout: number = 0;
  extendList: Event[] = [];
  on: WorldAfterEvents | WorldBeforeEvents | null = null;
}

class Event {
  status = new EventStatus();
  constructor(opt: EventOpt, loadExtend: (mcx: MCXFile<"event">) => Event) {
    this.status.all = Object.fromEntries(Object.entries(opt.data).map(vl => {
      if (opt.tick) {
        return [vl[0], generateAntiShake(vl[1], opt.tick)]
      }
      return vl
    }));
    if (opt.extends) this.status.extendList = opt.extends.map(loadExtend);
    this.status.on = opt.on == "after" ? _world.afterEvents : _world.beforeEvents;
  }
  private _execInExtends(method: keyof Event, ...args: any[]) {
    for (const i of this.status.extendList) {
      const fn = i[method];
      if (typeof fn !== "function") return;
      (fn as Function).apply(i, args);
    }
  }
  private _bindEvent(eventName: string, handler: (event: any) => void): BindResponse {
    if (!this.status.on) return {
      code: -1,
      msg: "Init Event error"
    }
    const isSubscribe = this.status.run.some(vl => vl == eventName);
    if (isSubscribe) return {
      code: -1,
      msg: "Can't subscribe again"
    };

    if (eventName in this.status.on) {
      this.status.on[eventName as keyof (WorldAfterEvents | WorldBeforeEvents)].subscribe(handler);
      this.status.run.push(eventName)
      this.status.runCout++;
      return {
        code: 200,
        msg: "success"
      }
    } else {
      return {
        code: -1,
        msg: "Not Found this event"
      }
    }
  }
  private _remove_bind_event(eventName: string, handler: (event: any) => void): BindResponse {
    if (!this.status.on) return {
      code: -1,
      msg: "Init Event error"
    };
    const isSubscribe = this.status.run.some(vl => vl == eventName);
    // if not run
    if (!isSubscribe) {
      return {
        code: -1,
        msg: "Can't stop a not bind event"
      }
    };
    if (eventName in this.status.on) {
      const name: (keyof typeof this.status.on) = eventName as keyof typeof this.status.on;
      this.status.on[name].unsubscribe(handler);
      const index = this.status.run.indexOf(eventName);
      if (index > -1) {
        this.status.run.splice(index, 1);
      }
      this.status.runCout--;
      return {
        code: 200,
        msg: "Success"
      }
    };
    return {
      code: -1,
      msg: "Not Found Event"
    }
  }
  public unsubscribe(...arg: string[]): boolean {
    this._execInExtends("unsubscribe", ...arg);
    let success = true;
    if (arg.length == 0) arg = Object.keys(this.status.all);
    for (const item of arg) {
      const handler = this.status.all[item];
      if (!handler || typeof handler !== "function") {
        success = false;
        console.warn("[mcx runtime]: can't find event handler for event: '" + item + "'");
        continue;
      }
      const response = this._remove_bind_event(item, handler);
      if (response.code !== 200) {
        success = false;
        console.warn(`[mcx runtime]: bind event '${item}' error: ${response.msg} `)
      }
    }
    return success;
  }
  public useWorld(w: World) {
    this._execInExtends("useWorld", w)
    _world = w;
  }
  public subscribe(...arg: string[]): boolean {
    this._execInExtends("subscribe", ...arg);
    if (arg.length == 0) arg = Object.keys(this.status.all);
    let success = true;
    for (const item of arg) {
      const handler = this.status.all[item];
      if (!handler || typeof handler !== "function") {
        console.warn("[mcx runtime]: can't find event handler for event: '" + item + "'");
        success = false;
        continue;
      }
      const response = this._bindEvent(item, handler);
      if (response.code !== 200) {
        success = false;
        console.warn(`[mcx runtime]: bind event '${item}' error: ${response.msg} `)
      }
    }
    return success;
  }
}

export { Event };
