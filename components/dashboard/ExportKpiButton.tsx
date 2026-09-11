'use client';

import { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface ExportKpiButtonProps {
  endpoint: string;
  showDateFilters?: boolean;
  align?: 'left' | 'right';
  title?: string;
}

export function ExportKpiButton({ endpoint, showDateFilters, align = 'left', title = 'Exportar' }: ExportKpiButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleExport = () => {
    let url = endpoint;
    if (showDateFilters) {
      url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const setWeekly = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
    setStartDate(monday);
    setEndDate(today);
  };

  if (!showDateFilters) {
    return (
      <button
        onClick={handleExport}
        className="w-6 h-6 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-colors cursor-pointer"
        title="Exportar a Excel"
      >
        <span className="material-symbols-outlined text-[14px]">download</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-colors cursor-pointer"
        title="Exportar a Excel"
      >
        <span className="material-symbols-outlined text-[14px]">download</span>
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-4 z-50 w-72`}>
          <h4 className="font-bold text-sm text-on-surface mb-3">{title}</h4>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setStartDate(new Date()); setEndDate(new Date()); }}
              className="flex-1 py-1.5 text-xs font-bold bg-surface-container rounded hover:bg-surface-variant text-on-surface-variant"
            >
              Diaria
            </button>
            <button
              onClick={setWeekly}
              className="flex-1 py-1.5 text-xs font-bold bg-surface-container rounded hover:bg-surface-variant text-on-surface-variant"
            >
              Semanal
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Desde:</label>
              <ReactDatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date || new Date())}
                className="w-full text-sm p-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Hasta:</label>
              <ReactDatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date || new Date())}
                className="w-full text-sm p-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface"
              />
            </div>
          </div>

          <button
            onClick={handleExport}
            className="w-full py-2 bg-primary-container text-black font-bold text-sm rounded-lg hover:bg-primary-fixed-dim transition-colors"
          >
            Descargar Excel
          </button>
        </div>
      )}
    </div>
  );
}
