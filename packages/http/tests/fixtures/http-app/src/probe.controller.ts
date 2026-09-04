import { Controller, Get } from "../../../../src";

interface StreamGate {
  readonly wait: Promise<void>;
}

declare global {
  var __rokkeHttpStreamGate: StreamGate | undefined;
}

@Controller("/probe")
export class ProbeController {
  @Get("")
  index(): Response {
    return Response.json({ ok: true });
  }

  @Get("/stream")
  stream(): Response {
    const gate = globalThis.__rokkeHttpStreamGate;
    let pullCount = 0;
    return new Response(new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (pullCount++ === 0) {
          controller.enqueue(new TextEncoder().encode("start"));
          return;
        }
        await gate?.wait;
        controller.enqueue(new TextEncoder().encode("-end"));
        controller.close();
      },
    }));
  }
}
