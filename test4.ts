import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { prisma } from './lib/prisma';

async function test() {
  try {
    const p = await prisma.product.findMany({
      include: {
        category_rel: true
      },
      where: {
        isActive: true,
      },
      orderBy: { barCode: 'asc' },
    });
    console.log("Found:", p.length);
  } catch(e) {
    console.error("FAIL:", e);
  } finally {
    //
  }
}
test();
