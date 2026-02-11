interface EventOpt {
  on: "after" | "before",
  data: Record<string, (event: any) => void>
}
export type {
  EventOpt
}