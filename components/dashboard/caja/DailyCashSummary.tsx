'use client';

import { useState } from 'react';
import { CashClosureModal } from './CashClosureModal';

interface DailyCashSummaryProps {
  orders: any[];
}

export function DailyCashSummary({ orders }: DailyCashSummaryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalEfectivo = orders.filter(o => o.paymentMethod === 'EFECTIVO').reduce((acc, o) => acc + o.grandTotal, 0);
  const totalTarjeta = orders.filter(o => o.paymentMethod === 'TARJETA').reduce((acc, o) => acc + o.grandTotal, 0);
  const totalTransferencia = orders.filter(o => o.paymentMethod === 'TRANSFERENCIA').reduce((acc, o) => acc + o.grandTotal, 0);

  const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia;

  return (
    <>
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-surface-variant bg-surface-container flex justify-between items-center">
        <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600">point_of_sale</span>
          Cuadre de Caja (Hoy)
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-sm py-2 flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">lock_person</span>
          Cerrar Caja
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
            <p className="text-sm text-center">Aún no hay órdenes facturadas el día de hoy.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container border-b border-outline-variant sticky top-0 text-on-surface-variant">
              <tr>
                <th className="py-3 px-4 font-bold">Orden</th>
                <th className="py-3 px-4 font-bold">Placa</th>
                <th className="py-3 px-4 font-bold">Método</th>
                <th className="py-3 px-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-4 text-on-surface font-medium">#{order.orderNumber}</td>
                  <td className="py-3 px-4 text-on-surface-variant font-bold">{order.vehicle.plate}</td>
                  <td className="py-3 px-4">
                    <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded uppercase">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-on-surface">
                    ${order.grandTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-5 bg-surface-container-highest text-on-surface border-t border-surface-variant">
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm border-b border-surface-variant pb-4">
          <div>
            <p className="text-on-surface-variant font-body-sm mb-1">Efectivo</p>
            <p className="font-label-bold text-label-lg">${totalEfectivo.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-on-surface-variant font-body-sm mb-1">Tarjeta</p>
            <p className="font-label-bold text-label-lg">${totalTarjeta.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-on-surface-variant font-body-sm mb-1">Transferencia</p>
            <p className="font-label-bold text-label-lg">${totalTransferencia.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-between items-end mt-4">
          <p className="text-on-surface-variant uppercase text-xs font-label-bold tracking-wider">Total del Día</p>
          <p className="text-3xl font-headline-lg text-primary">${totalGeneral.toLocaleString()}</p>
        </div>
      </div>
    </div>
    
    <CashClosureModal 
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  );
}
