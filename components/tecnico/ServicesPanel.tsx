import { ServiceCard } from './ServiceCard';
import { useState } from 'react';

interface ServicesPanelProps {
  catalogServices: any[];
  selectedServices: string[];
  onToggleService: (id: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ServicesPanel = ({
  catalogServices,
  selectedServices,
  onToggleService,
  onSubmit,
  isSubmitting
}: ServicesPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = catalogServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = selectedServices.reduce((acc, id) => {
    const service = catalogServices.find(s => s.id === id);
    return acc + (service ? Number(service.basePrice) : 0);
  }, 0);

  return (
    <section className="w-full md:w-3/5 bg-gray-50 flex flex-col overflow-hidden" data-purpose="services-order">
      {/* Search Bar Area */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg aria-hidden="true" className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" fillRule="evenodd"></path>
            </svg>
          </div>
          <input 
            className="block w-full pl-11 pr-3 py-4 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 cursor-pointer" 
            placeholder="Buscar Servicios y Repuestos..." 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Services Grid */}
      <div className="p-6 flex-1 overflow-y-auto border-b border-gray-200">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Catálogo de Servicios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredServices.map(service => (
            <ServiceCard 
              key={service.id} 
              id={service.id} 
              name={service.name} 
              iconPath={service.icon || 'minor_crash'} 
              price={Number(service.basePrice)}
              isSelected={selectedServices.includes(service.id)}
              onToggle={() => onToggleService(service.id)}
            />
          ))}
          
          {filteredServices.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-8">No hay servicios que coincidan con la búsqueda.</p>
          )}
        </div>
      </div>
      
      {/* Order Summary & Submit */}
      <div className="p-6 bg-white border-t border-gray-200 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900">Resumen de Orden</h2>
          <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-full">{selectedServices.length} ITEMS</span>
        </div>
        
        {selectedServices.length === 0 ? (
          <p className="text-sm text-gray-500 italic mb-4">No hay servicios seleccionados aún.</p>
        ) : (
          <div className="mb-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total a pagar:</span>
              <span>${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        <button 
          onClick={onSubmit}
          disabled={isSubmitting || selectedServices.length === 0}
          className={`w-full font-bold text-lg py-5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm mt-auto 
            ${(isSubmitting || selectedServices.length === 0) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FFEC00] hover:bg-[#e6d400] text-gray-900 cursor-pointer'}`}
        >
          {isSubmitting ? 'Procesando...' : 'Finalizar y Enviar a Caja'}
          {!isSubmitting && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          )}
        </button>
      </div>
    </section>
  );
};
