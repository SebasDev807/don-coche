import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AliaddoService } from './aliaddo';

// Mock simple de fetch
const originalFetch = global.fetch;

describe('AliaddoService', () => {
  const dummyPayload = {
    date: '2026-08-08',
    dueDate: '2026-08-08',
    paymentFormCode: 'CR',
    paymentMeanCode: '10',
    currencyCode: 'COP',
    details: [
      {
        unitValueBeforeTax: 1000,
        quantity: 1,
        description: 'Servicio de prueba'
      }
    ]
  };

  it('Debería lanzar error si las credenciales no están configuradas', async () => {
    // Temporalmente borramos las variables de entorno
    const backupUrl = process.env.ALIADDO_API_URL;
    const backupKey = process.env.ALIADDO_API_KEY;
    
    delete process.env.ALIADDO_API_URL;
    delete process.env.ALIADDO_API_KEY;

    try {
      await AliaddoService.createInvoice(dummyPayload);
      assert.fail('Debería haber lanzado un error');
    } catch (error: any) {
      assert.strictEqual(error.message, 'Las credenciales de Aliaddo no están configuradas');
    } finally {
      // Restaurar
      process.env.ALIADDO_API_URL = backupUrl;
      process.env.ALIADDO_API_KEY = backupKey;
    }
  });

  it('Debería enviar correctamente la petición a la API y retornar datos', async () => {
    // Configurar entorno mock
    process.env.ALIADDO_API_URL = 'https://mock.aliaddo.net/v1';
    process.env.ALIADDO_API_KEY = 'mock_key';

    const mockResponse = { id: 'inv_123', status: 'created' };

    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://mock.aliaddo.net/v1/invoices');
      assert.strictEqual(options?.method, 'POST');
      assert.ok(options?.headers);
      assert.strictEqual((options.headers as any)['Authorization'], 'Bearer mock_key');
      
      const body = JSON.parse(options.body as string);
      assert.strictEqual(body.paymentFormCode, 'CR');

      return {
        ok: true,
        json: async () => mockResponse,
      } as Response;
    };

    try {
      const result = await AliaddoService.createInvoice(dummyPayload);
      assert.deepStrictEqual(result, mockResponse);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Debería manejar errores de la API correctamente', async () => {
    process.env.ALIADDO_API_URL = 'https://mock.aliaddo.net/v1';
    process.env.ALIADDO_API_KEY = 'mock_key';

    global.fetch = async () => {
      return {
        ok: false,
        status: 409,
        json: async () => ({ message: 'Conflicto en datos' }),
      } as Response;
    };

    try {
      await AliaddoService.createInvoice(dummyPayload);
      assert.fail('Debería haber lanzado un error');
    } catch (error: any) {
      assert.ok(error.message.includes('Error en Aliaddo (409)'));
      assert.ok(error.message.includes('Conflicto en datos'));
    } finally {
      global.fetch = originalFetch;
    }
  });
});

