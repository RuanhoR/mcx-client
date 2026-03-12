import { MCXFile } from "@mbler/mcx-types";
import { App } from "./lib/App";

export function createApp(app: MCXFile<"app">) {
  return new App(app)
}