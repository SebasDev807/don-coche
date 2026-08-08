export interface AliaddoInvoicePayload {
  paymentFormCode: string; // Ej: "CR" (Contado/Crédito)
  paymentMeanCode: string; // Ej: "10" (Efectivo)
  currencyCode: string; // Ej: "COP"
  // Aquí se agregarían luego los campos de cliente y productos, 
  // según la documentación completa de creación de factura.
  [key: string]: any;
}

export class AliaddoService {
  private static get baseUrl() {
    return process.env.ALIADDO_API_URL;
  }

  private static get apiKey() {
    return process.env.ALIADDO_API_KEY;
  }

  private static get headers() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Crea una factura electrónica en Aliaddo
   */
  static async createInvoice(payload: AliaddoInvoicePayload) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Las credenciales de Aliaddo no están configuradas');
    }

    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Error en Aliaddo (${response.status}): ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  }
}
