import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysOrders = await prisma.order.findMany({
    where: {
      status: 'FACTURADA',
      billedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      products: {
        include: { product: true }
      },
      services: {
        include: { service: true }
      }
    }
  });

  let totalSales = 0;
  let totalCost = 0;

  for (const order of todaysOrders) {
    let orderSales = Number(order.grandTotal);
    let orderCost = 0;
    console.log(`Order ${order.id} | GrandTotal: ${orderSales}`);

    for (const orderProduct of order.products) {
      let productCost = Number(orderProduct.unitCost) * orderProduct.quantity;
      orderCost += productCost;
      console.log(`  Product ${orderProduct.product.name} | Qty: ${orderProduct.quantity} | UnitCost: ${orderProduct.unitCost} | TotalCost: ${productCost}`);
    }
    for (const orderService of order.services) {
      let serviceCost = Number(orderService.service.basePrice);
      orderCost += serviceCost;
      console.log(`  Service ${orderService.service.name} | BasePrice (Cost): ${serviceCost} | ChargedPrice (Revenue): ${orderService.chargedPrice}`);
    }
    
    console.log(`  -> Order Sales: ${orderSales}, Order Cost: ${orderCost}`);
    totalSales += orderSales;
    totalCost += orderCost;
  }

  const totalProfit = totalSales - totalCost;
  const averageMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  console.log(`\n================================`);
  console.log(`Total Sales: ${totalSales}`);
  console.log(`Total Cost: ${totalCost}`);
  console.log(`Total Profit: ${totalProfit}`);
  console.log(`Average Margin: ${averageMargin}%`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
