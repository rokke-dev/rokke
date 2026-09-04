export class DebugInProductionError extends Error {
  constructor() {
    super('Configuración inválida: "app.debug" es true con "app.env" en "production" — esto expondría stack traces. Corrige APP_DEBUG antes de desplegar.');
    this.name = "DebugInProductionError";
  }
}
