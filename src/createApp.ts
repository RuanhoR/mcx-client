import type {
  MCXFile
} from "@mbler/mcx-types"
import {
  MCXApp
} from "./lib/mcx"
export default function createApp(content: MCXFile<"app">) {
  if (content.type !== "app") throw new Error("[mcx runtime]: createApp must input a MCXFile<app>");
  return new MCXApp(content)
}