import 'dotenv/config';

async function testEmail() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.ALIADDO_API_KEY}`,
  };
  const baseUrl = process.env.ALIADDO_API_URL;
  const invoiceId = '94f435f2-9fb4-40c6-808d-ce181e92b48e';

  const urls = [
    `/invoices/${invoiceId}/email`,
    `/invoices/${invoiceId}/send`,
    `/invoices/${invoiceId}/send-email`,
  ];

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    const res = await fetch(`${baseUrl}${url}`, { method: 'POST', headers });
    console.log(res.status, await res.text().catch(() => ''));
  }
}

testEmail().catch(console.error);
