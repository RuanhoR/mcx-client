import {
  type World,
  world,
  type WorldAfterEvents,
  type WorldBeforeEvents,
} from "@minecraft/server";
import { EventOpt, MCXFile } from "@mbler/mcx-types";
function exports() {
  let _world: World = world;
  const Event = class Event {
    #currenyRun: string[] = [];
    #canRun: string[] = [];
    #eventList: EventOpt["data"] = {};
    #on: "after" | "before";
    #extendsList: Event[] = [];
    #tick: number | null = null;
    #lastRun: number = Date.now()
    constructor(data: EventOpt) {
      this.#canRun = Object.keys(data.data);
      this.#eventList = Object.fromEntries(Object.entries(data.data).map(item => {
        return [item[0], this.#summonEventStructe(item[1])]
      }));
      this.#on = data.on;
      if (Array.isArray(data.extends) && data.extends?.length >= 1) {
        this.#extendsList = data.extends.map<Event>(
          (item: MCXFile<"event">): Event => {
            if (item.type !== "event") {
              throw new TypeError(
                "[extend event]: Event extends must Event class",
              );
            }
            if (item.event instanceof Event) return item.event as Event;
            throw new TypeError("[extend event]: not MCXFile<event>");
          },
        );
      }
      if (data.tick) {
        this.#tick = data.tick
      }
    }
    #summonEventStructe(fn: (event: any) => void): (event: any) => void {
      return (event) => {
        const time = Date.now()
        if (this.#tick && this.#tick >= 1) {
          if (time - this.#lastRun <= this.#tick) {
            return;
          } else {
            this.#lastRun = time;
          }
        };
        fn(event);
      }
    }
    #execInExtend<K extends keyof MCXFile<"event">["event"]>(
      key: K,
      arg: Parameters<MCXFile<"event">["event"][K]> | any,
    ) {
      for (const extItem of this.#extendsList) {
        const run = extItem[key];
        if (typeof run === "function") {
          if (Array.isArray(arg)) {
            (run as (...args: any[]) => any)(...(arg as any[])); // Cast to function with rest args and arg as any[]
          } else {
            run(arg);
          }
        }
      }
    }
    /**
     *
     * @param eventName {string} - eventName
     * @returns {boolean} - if succeess
     */
    #bind_event(eventItem: string): boolean {
      if (this.#currenyRun.includes(eventItem)) return true;
      if (this.#on == "after" && eventItem in _world.afterEvents) {
        const key = eventItem as keyof WorldAfterEvents;
        const subscribe = _world.afterEvents[key];
        const handler = this.#eventList[eventItem];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.subscribe(handler);
        this.#currenyRun.push(eventItem);
        return true;
      }
      if (this.#on == "before" && eventItem in _world.beforeEvents) {
        const key = eventItem as keyof WorldBeforeEvents;
        const subscribe = _world.beforeEvents[key];
        const handler = this.#eventList[eventItem];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.subscribe(handler);
        this.#currenyRun.push(eventItem);
        return true;
      }
      return false;
    }
    public subscribe(...events: string[]): boolean {
      this.#execInExtend("subscribe", events)
      if (!events || events.length == 0) {
        // 求差集
        const list = this.#canRun.filter((item: string) => {
          return !this.#currenyRun.includes(item);
        });
        // all subscribe
        for (const eventItem of list) {
          if (!eventItem) continue;
          const s = this.#bind_event(eventItem);
          if (!s)
            throw new Error(
              "[bind event]: bind event: '" + eventItem + "' error",
            );
        }
      } else {
        for (const eventName of events) {
          if (typeof eventName !== "string")
            throw new Error("[bind event]: bind eventname is not ");
          const status = this.#bind_event(eventName);
          if (!status)
            throw new Error("[bind event]: event: '" + eventName + "' error");
        }
      }
      return true;
    }
    #unbind_event(eventName: string): boolean {
      if (!this.#currenyRun.includes(eventName)) {
        throw new Error("[bind event]: can't close a not running event");
      }
      if (this.#on == "after" && eventName in _world.afterEvents) {
        const key = eventName as keyof WorldAfterEvents;
        const subscribe = _world.afterEvents[key];
        const handler = this.#eventList[eventName];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.unsubscribe(handler);
        this.#currenyRun = this.#currenyRun.filter((item) => eventName != item);
        return true;
      }
      if (this.#on == "before" && eventName in _world.beforeEvents) {
        const key = eventName as keyof WorldBeforeEvents;
        const subscribe = _world.beforeEvents[key];
        const handler = this.#eventList[eventName];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.unsubscribe(handler);
        this.#currenyRun = this.#currenyRun.filter((item) => eventName != item);
        return true;
      }
      return false;
    }
    /**
     * unscribe
     */
    public unscribe(...events: string[]) {
      this.#execInExtend("unscribe", events)
      if (!events || events.length == 0) {
        // all run event
        for (const eventItem of this.#currenyRun) {
          if (!eventItem) continue;
          const s = this.#unbind_event(eventItem);
          if (!s)
            throw new Error(
              "[bind event]: bind event: '" + eventItem + "' error",
            );
        }
      } else {
        for (const eventName of events) {
          if (typeof eventName !== "string") throw new Error("");
          const status = this.#unbind_event(eventName);
          if (!status)
            throw new Error("[bind event]: event: '" + eventName + "' error");
        }
      }
      return true;
    }
    public useWorld(__world: World) {
      this.#execInExtend("useWorld", __world)
      _world = __world; // placeholder to satisfy type
    }
  };
  return Event;
}

const im = exports();
export default im;
