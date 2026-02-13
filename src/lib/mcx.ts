import { MCXFile } from "@mbler/mcx-types";
import type { World } from "@minecraft/server";

export class MCXApp {
  constructor(private content: MCXFile<"app">) {
  }
  mout(world: World) {
    const event = this.content.app.event;
    if (event) event.useWorld(world);
  }
}