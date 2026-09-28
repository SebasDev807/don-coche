import { prisma } from './lib/prisma';
import fs from 'fs';

async function main() {
  if (!fs.existsSync('stock-backup.json')) {
    console.error('No backup file found!');
    return;
  }
  
  const backup = JSON.parse(fs.readFileSync('stock-backup.json', 'utf8'));
  let revertedCount = 0;
  
  for (const item of backup) {
    await prisma.product.update({
      where: { id: item.id },
      data: { stock: item.stock }
    });
    revertedCount++;
  }

  console.log(`Successfully reverted stock for ${revertedCount} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
