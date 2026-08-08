import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  const o = await prisma.order.findUnique({
    where: { orderNumber: 57 }
  });
  console.log(`Aliaddo Invoice ID: ${o?.aliaddoInvoiceId}`);

  if (o?.aliaddoInvoiceId) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.ALIADDO_API_KEY}`,
    };
    const res = await fetch(`${process.env.ALIADDO_API_URL}/invoices/${o.aliaddoInvoiceId}`, { headers });
    const json = await res.json();
    console.log('Details from Aliaddo:');
    json.details?.forEach((d: any) => {
      console.log(`- ${d.itemCode}: ${d.itemName} (${d.description})`);
    });
  }
}

main().catch(console.error).finally(() => process.exit(0));
