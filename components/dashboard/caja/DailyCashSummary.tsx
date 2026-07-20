interface DailyCashSummaryProps {
  orders: any[];
}

export function DailyCashSummary({ orders }: DailyCashSummaryProps) {
  const totalEfectivo = orders.filter(o => o.paymentMethod === 'EFECTIVO').reduce((acc, o) => acc + o.grandTotal, 0);
  const totalTarjeta = orders.filter(o => o.paymentMethod === 'TARJETA').reduce((acc, o) => acc + o.grandTotal, 0);
  const totalTransferencia = orders.filter(o => o.paymentMethod === 'TRANSFERENCIA').reduce((acc, o) => acc + o.grandTotal, 0);
  
  const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600">point_of_sale</span>
          Cuadre de Caja (Hoy)
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
            <p className="text-sm text-center">Aún no hay órdenes facturadas el día de hoy.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-gray-100 sticky top-0 text-gray-500">
              <tr>
                <th className="py-3 px-4 font-bold">Orden</th>
                <th className="py-3 px-4 font-bold">Placa</th>
                <th className="py-3 px-4 font-bold">Método</th>
                <th className="py-3 px-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-900 font-medium">#{order.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-600 font-bold">{order.vehicle.plate}</td>
                  <td className="py-3 px-4">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    ${order.grandTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-5 bg-gray-900 text-white border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm border-b border-gray-700 pb-4">
          <div>
            <p className="text-gray-400 mb-1">Efectivo</p>
            <p className="font-bold">${totalEfectivo.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Tarjeta</p>
            <p className="font-bold">${totalTarjeta.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Transfer</p>
            <p className="font-bold">${totalTransferencia.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <p className="text-gray-400 uppercase text-xs font-bold tracking-wider">Gran Total del Día</p>
          <p className="text-3xl font-black text-[#FFEC00]">${totalGeneral.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
