import { Injectable, Logger } from '@nestjs/common';

// Sin webhook configurado, el servicio no hace nada: las alertas son
// opcionales, no un requisito para que NetPulse funcione.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendAlert(message: string): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }

    try {
      // El mismo payload sirve para Discord ("content") y Slack ("text")
      // sin necesidad de detectar el proveedor.
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, text: message }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar la alerta al webhook: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
