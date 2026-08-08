export interface AliaddoInvoiceDetail {
  unitValueBeforeTax: string | number;
  itemCode?: string;
  quantity: string | number;
  warehouseId?: string;
  description: string;
  discountAmount?: number;
  discountIsPercent?: boolean;
  taxes?: { id: string }[];
  withholdings?: { id: string }[];
}

export interface AliaddoInvoicePayload {
  personId?: string; // ID del cliente en Aliaddo
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentFormCode: string; // Ej: "CR"
  paymentMeanCode: string; // Ej: "10"
  purchaseOrderNumber?: string;
  costCenterId?: string;
  personIdSeller?: string;
  branchId?: string;
  details: AliaddoInvoiceDetail[];
  currencyCode: string; // "COP"
  exchangeRate?: number;
  accountCodePayment?: string;
  observation?: string;
  customerNote?: string;
  termsAndConditions?: string;
  customer?: {
    email?: string;
    [key: string]: any;
  };
}

export interface AliaddoInvoiceResponse {
  id: string;
  consecutive: string;
  cufe: string;
  qr: string;
  status: string;
  statusDian: string;
  stateDian: string;
  stateDianReason: string[];
  totalAmount: number;
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
   * Crea una factura electrónica en Aliaddo.
   * Retorna el objeto completo con id, cufe, qr, etc.
   */
  static async createInvoice(payload: AliaddoInvoicePayload): Promise<AliaddoInvoiceResponse> {
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

  /**
   * Consulta el estado de una factura por ID para obtener su CUFE actualizado.
   */
  static async getInvoice(invoiceId: string): Promise<AliaddoInvoiceResponse> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Las credenciales de Aliaddo no están configuradas');
    }
    const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}`, {
      headers: this.headers,
    });
    if (!response.ok) {
      throw new Error(`Error al consultar factura Aliaddo (${response.status})`);
    }
    return await response.json();
  }

  /**
   * Construye la URL del catálogo de la DIAN para visualizar/verificar la factura.
   * El CUFE es el identificador único del documento ante la DIAN.
   */
  static buildDianViewerUrl(cufe: string): string {
    return `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;
  }
}
