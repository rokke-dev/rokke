import type { Event } from "./event";
interface ListenerMetadata {
  eventClass?: Function;
}
export function Listener(eventClass: new (...args: any[]) => Event) {
  return function <T extends new (...args: any[]) => object>(_target: T, context: ClassDecoratorContext<T>): void {
    const meta = context.metadata as unknown as ListenerMetadata;
    meta.eventClass = eventClass;
    (context.metadata as { injectable?: boolean }).injectable = true;
  };
}
