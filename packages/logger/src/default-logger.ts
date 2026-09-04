import { FrameworkLogger } from "./framework-logger";
import { ConsoleTransport } from "./transports/console-transport";
import type { Logger } from "./logger";
const defaultLogger: Logger = new FrameworkLogger([new ConsoleTransport()]);
export default defaultLogger;
