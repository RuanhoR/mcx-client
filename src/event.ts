import {
  World,
  world as _world,
  WorldAfterEvents,
  WorldBeforeEvents,
} from "@minecraft/server";
import { EventOpt } from "@mbler/mcx-types";
function exports() {
  let world: World = _world;
  const Event = class Event {
    #currenyRun: string[] = [];
    #canRun: string[] = [];
    #eventList: EventOpt["data"] = {};
    #on: "after" | "before";
    constructor(data: EventOpt) {
      this.#canRun = Object.keys(data.data);
      this.#eventList = data.data;
      this.#on = data.on;
    }
    /**
     *
     * @param eventName {string} - eventName
     * @returns {boolean} - if succeess
     */
    #bind_event(eventItem: string): boolean {
      if (this.#currenyRun.includes(eventItem)) return true;
      if (this.#on == "after" && eventItem in world.afterEvents) {
        const key = eventItem as keyof WorldAfterEvents;
        const subscribe = world.afterEvents[key];
        const handler = this.#eventList[eventItem];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.subscribe(handler);
        this.#currenyRun.push(eventItem);
        return true;
      }
      if (this.#on == "before" && eventItem in world.beforeEvents) {
        const key = eventItem as keyof WorldBeforeEvents;
        const subscribe = world.beforeEvents[key];
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
      if (!events || events.length == 0) {
        // 求差集
        const list = this.#canRun.filter((item: string) => {
          return !this.#currenyRun.includes(item);
        });
        // all subscribe
        for (const eventIndex in list) {
          const eventItem = this.#canRun[eventIndex];
          if (!eventItem) continue;
          const s = this.#bind_event(eventItem);
          if (!s)
            throw new Error(
              "[bind event]: bind event '" + eventItem + "' error",
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
      if (this.#on == "after" && eventName in world.afterEvents) {
        const key = eventName as keyof WorldAfterEvents;
        const subscribe = world.afterEvents[key];
        const handler = this.#eventList[eventName];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.unsubscribe(handler);
        this.#currenyRun.push(eventName);
        return true;
      }
      if (this.#on == "before" && eventName in world.beforeEvents) {
        const key = eventName as keyof WorldBeforeEvents;
        const subscribe = world.beforeEvents[key];
        const handler = this.#eventList[eventName];
        if (!handler || typeof handler !== "function")
          throw new Error("[event bind]: mcx bind event: handler is not right");
        subscribe.unsubscribe(handler);
        this.#currenyRun.push(eventName);
        return true;
      }
      return false;
    }
    /**
     * unscribe
     */
    public unscribe(...events: string[]) {
      if (!events || events.length == 0) {
        // all run event
        for (const eventIndex in this.#currenyRun) {
          const eventItem = this.#canRun[eventIndex];
          if (!eventItem) continue;
          const s = this.#unbind_event(eventItem);
          if (!s)
            throw new Error(
              "[bind event]: bind event '" + eventItem + "' error",
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
    public useWorld(_world: World) {
      world = _world;
    }
  };
  return Event;
}

const im = exports();
export default im;
