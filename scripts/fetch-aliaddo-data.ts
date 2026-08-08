import 'dotenv/config';

async function fetchAliaddoData() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.ALIADDO_API_KEY}`,
  };
  const baseUrl = process.env.ALIADDO_API_URL;

  console.log('--- FETCHING INVOICES TO GET PERSON ID ---');
  try {
    const res = await fetch(`${baseUrl}/invoices`, { headers });
    const json = await res.json();
    console.log(JSON.stringify(json).substring(0, 2000));
  } catch (err: any) {
    console.error('Error fetching invoices:', err.message);
  }
}

fetchAliaddoData();
