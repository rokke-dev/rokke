import { bindInjectable, discoverModules, token, type Container } from "@rokke/core";
import { LoggerToken } from "@rokke/logger";
import type { Event } from "./event";
import type { Logger } from "@rokke/logger";
export interface EventListener<E extends Event> {
  handle(event: E): Promise<void>;
}
export class EventBus {
  readonly #listenersByEventClass = new Map<Function, Array<EventListener<Event>>>();
  readonly #container: Container;
  constructor(container: Container) {
    this.#container = container;
  }
  register(eventClass: Function, listener: EventListener<Event>): void {
    const list = this.#listenersByEventClass.get(eventClass) ?? [];
    list.push(listener);
    this.#listenersByEventClass.set(eventClass, list);
  }
  emit<E extends Event>(event: E): void {
    const listeners = this.#listenersByEventClass.get(event.constructor) ?? [];
    for (const listener of listeners) {
      void listener.handle(event).catch((error) => {
        try {
          const logger = this.#container.get(LoggerToken) as Logger;
          logger.error("Error en listener de evento", { event: event.constructor.name, error });
        } catch {
          console.error("Error en listener de evento y Logger no disponible", error);
        }
      });
    }
  }
}
export async function discoverListeners(basePath: string, container: Container, bus: EventBus, pattern = "src/**/*.listener.ts"): Promise<void> {
  const modules = await discoverModules(pattern, basePath);
  for (const { exports } of modules) {
    for (const exported of Object.values(exports)) {
      if (typeof exported !== "function") continue;
      const meta = (exported as any)[Symbol.metadata];
      if (!meta?.eventClass) continue;
      const instanceToken = token<EventListener<Event>>("__listener__${exported.name}");
      bindInjectable(container, instanceToken, exported as never);
      bus.register(meta.eventClass, container.get(instanceToken));
    }
  }
}