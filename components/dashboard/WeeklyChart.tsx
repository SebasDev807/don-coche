'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getDailySalesHistory } from '@/actions/dashboard/kpis.actions';

interface ChartData {
  dateStr?: string;
  dia: string;
  lavadero: number;
  serviteca: number;
}

interface WeeklyChartProps {
  data: ChartData[];
}

interface DailyItem {
  name: string;
  category: string;
  price: number;
  quantity: number;
  type: 'Service' | 'Product';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-variant shadow-md">
        <p className="font-label-bold text-sm text-on-surface mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-on-surface-variant capitalize">{entry.name}:</span>
            <span className="font-bold text-on-surface">
              ${entry.value.toLocaleString('es-CO')}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-surface-variant flex justify-between gap-4 text-xs font-bold text-on-surface">
          <span>Total:</span>
          <span>
            ${payload.reduce((acc: number, curr: any) => acc + curr.value, 0).toLocaleString('es-CO')}
          </span>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2 text-center italic">Click para ver detalle</p>
      </div>
    );
  }
  return null;
};

export function WeeklyChart({ data }: WeeklyChartProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [dailyItems, setDailyItems] = useState<DailyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleBarClick = async (clickedEventData: any) => {
    if (!clickedEventData) return;
    
    let selectedDateStr = '';
    let selectedDia = '';

    // Si viene del BarChart y clickearon en el fondo de una columna, usamos activeLabel
    if (clickedEventData.activeLabel) {
      const dayData = data.find(d => d.dia === clickedEventData.activeLabel);
      if (dayData && dayData.dateStr) {
        selectedDateStr = dayData.dateStr;
        selectedDia = dayData.dia;
      }
    } 
    // Si viene de activePayload
    else if (clickedEventData.activePayload && clickedEventData.activePayload.length > 0) {
      const p = clickedEventData.activePayload[0].payload;
      if (p.dateStr) {
        selectedDateStr = p.dateStr;
        selectedDia = p.dia;
      }
    }
    // Si viene directo de la Barra
    else if (clickedEventData.payload && clickedEventData.payload.dateStr) {
      selectedDateStr = clickedEventData.payload.dateStr;
      selectedDia = clickedEventData.payload.dia;
    }
    // O si el propio objeto es el ChartData
    else if (clickedEventData.dateStr) {
      selectedDateStr = clickedEventData.dateStr;
      selectedDia = clickedEventData.dia;
    }

    if (!selectedDateStr) {
      // Click en espacio vacío donde no hay datos para un día
      return;
    }

    setSelectedDay(selectedDia);
    setIsModalOpen(true);
    setIsLoading(true);

    try {
      const res = await getDailySalesHistory(selectedDateStr);
      if (res.success && res.data) {
        setDailyItems(res.data);
      } else {
        setDailyItems([]);
      }
    } catch (e) {
      console.error(e);
      setDailyItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ResponsiveContainer width="100%" height={256}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 0,
            left: 0,
            bottom: 0,
          }}
          barGap={2}
          barSize={24}
          onClick={handleBarClick}
          style={{ cursor: 'pointer' }}
        >
          <XAxis 
            dataKey="dia" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'var(--color-surface-container-high)', opacity: 0.4 }}
          />
          <Bar dataKey="lavadero" name="Lavadero" fill="var(--color-primary-container)" radius={[4, 4, 0, 0]} onClick={handleBarClick} />
          <Bar dataKey="serviteca" name="Serviteca" fill="var(--color-tertiary)" radius={[4, 4, 0, 0]} onClick={handleBarClick} />
        </BarChart>
      </ResponsiveContainer>

      {/* Modal Detalles del Día */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 fade-in p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-headline-md text-lg text-on-surface font-bold">
                Detalle de Ventas - {selectedDay}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-surface">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : dailyItems.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">No hay ventas registradas para este día.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {dailyItems.map((item, i) => (
                    <div key={i} className="bg-surface-container-lowest p-3 rounded-lg border border-surface-variant flex justify-between items-center hover:bg-surface-container-low transition-colors">
                      <div className="flex flex-col">
                        <span className="font-label-bold text-sm text-on-surface">{item.name}</span>
                        <div className="flex gap-2 items-center mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.category === 'LAVADERO' ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary text-on-tertiary'}`}>
                            {item.category}
                          </span>
                          <span className="text-xs text-on-surface-variant">Cant: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-bold text-on-surface">
                        ${(item.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!isLoading && dailyItems.length > 0 && (
              <div className="p-4 border-t border-surface-variant bg-surface-container-lowest flex justify-between items-center font-bold text-on-surface">
                <span>Total del Día:</span>
                <span className="text-lg">
                  ${dailyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
