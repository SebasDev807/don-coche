import 'dotenv/config';
import { AliaddoService, AliaddoInvoicePayload } from '../lib/services/aliaddo';

async function runIntegrationTest() {
  console.log('🧪 Iniciando test de integración con Aliaddo...');
  console.log(`🔗 URL configurada: ${process.env.ALIADDO_API_URL}`);
  
  if (!process.env.ALIADDO_API_KEY) {
    console.error('❌ Error: ALIADDO_API_KEY no está configurada.');
    process.exit(1);
  }

  // Payload básico según la indicación del usuario
  const payload: AliaddoInvoicePayload = {
    paymentFormCode: 'CR',
    paymentMeanCode: '10',
    currencyCode: 'COP',
    // Mock de datos requeridos típicamente en facturación electrónica
    // En caso de que la API requiera más, este test fallará y nos dirá qué falta
    items: [
      {
        name: 'Servicio de prueba',
        price: 1000,
        quantity: 1
      }
    ],
    customer: {
      documentType: '13', // Cédula
      documentNumber: '123456789',
      name: 'Cliente Prueba'
    }
  };

  try {
    console.log('📤 Enviando payload a Aliaddo:', JSON.stringify(payload, null, 2));
    const response = await AliaddoService.createInvoice(payload);
    
    console.log('✅ Respuesta exitosa de Aliaddo:');
    console.log(JSON.stringify(response, null, 2));
    console.log('🎉 Test de integración finalizado con éxito.');
  } catch (error: any) {
    console.error('❌ Falló la integración con Aliaddo:');
    console.error(error.message);
  }
}

runIntegrationTest();
