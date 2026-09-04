import { test, expect, describe, mock } from "bun:test";
import { Event } from "../src/event";
import { EventBus } from "../src/event-bus";
import { InMemoryContainer } from "@rokke/core";
class MyEvent extends Event {
  public data: string;
  constructor(data: string) { super(); this.data = data; }
}
describe("Events", () => {
  test("emit() no espera a que el listener termine", async () => {
    const container = new InMemoryContainer();
    const bus = new EventBus(container);
    let finished = false;
    bus.register(MyEvent, {
      async handle(event: MyEvent) {
        await new Promise(resolve => setTimeout(resolve, 50));
        finished = true;
      }
    });
    bus.emit(new MyEvent("test"));
    expect(finished).toBe(false);
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(finished).toBe(true);
  });
  test("un listener que lanza no interrumpe a otros listeners del mismo evento", async () => {
    const container = new InMemoryContainer();
    const bus = new EventBus(container);
    let secondCalled = false;
    bus.register(MyEvent, {
      async handle() { throw new Error("fail"); }
    });
    bus.register(MyEvent, {
      async handle() { secondCalled = true; }
    });
    bus.emit(new MyEvent("test"));
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(secondCalled).toBe(true);
  });
});