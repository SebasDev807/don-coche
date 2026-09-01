import { CustomerSearchBar, type CustomerSuggestion, type VehicleInfo } from './CustomerSearchBar';
import { VehicleSelector } from './VehicleSelector';

interface RegistrationFormProps {
  plate: string;
  setPlate: (val: string) => void;
  customerCc: string;
  setCustomerCc: (val: string) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  carBrand: string;
  setCarBrand: (val: string) => void;
  carModel: string;
  setCarModel: (val: string) => void;
  carColor: string;
  setCarColor: (val: string) => void;
  onSelectCustomer: (customer: CustomerSuggestion) => void;
  customerVehicles: VehicleInfo[];
  onSelectVehicle: (vehicle: VehicleInfo) => void;
  nextMaintenanceDate: string;
  nextMaintenanceReason: string;
  onOpenRecommendationModal: () => void;
}

export const RegistrationForm = ({
  plate, setPlate,
  customerCc, setCustomerCc,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  customerEmail, setCustomerEmail,
  carBrand, setCarBrand,
  carModel, setCarModel,
  carColor, setCarColor,
  onSelectCustomer,
  customerVehicles,
  onSelectVehicle,
  nextMaintenanceDate,
  nextMaintenanceReason,
  onOpenRecommendationModal
}: RegistrationFormProps) => {
  return (
    <section className="w-full h-full bg-surface-container-lowest border-r border-surface-variant lg:border-r p-8 flex flex-col overflow-y-auto" data-purpose="registration-form">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">Registro de Vehículo</h1>
        <p className="text-on-surface-variant text-base leading-relaxed">Ingrese los detalles para iniciar una nueva orden de servicio.</p>
      </div>
      <form className="flex-1 flex flex-col gap-6">
        {/* Búsqueda de cliente y selector de vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomerSearchBar onSelectCustomer={onSelectCustomer} />
          <VehicleSelector vehicles={customerVehicles} onSelectVehicle={onSelectVehicle} />
        </div>
        
        <hr className="border-surface-variant" />

        <div>
          <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="placa">Placa</label>
          <input 
            className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-lg py-4 px-4 text-on-surface placeholder-on-surface-variant/50 font-bold uppercase cursor-pointer" 
            id="placa" 
            placeholder="ABC-1234" 
            type="text" 
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="cc">Cédula de Ciudadanía (CC)</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-4 px-4 text-on-surface placeholder-on-surface-variant cursor-pointer" 
              id="cc" 
              placeholder="Ej: 1700000000" 
              type="text" 
              value={customerCc}
              onChange={(e) => setCustomerCc(e.target.value)}
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="propietario">Nombre del Propietario</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-4 px-4 text-on-surface placeholder-on-surface-variant cursor-pointer" 
              id="propietario" 
              placeholder="Nombre Completo" 
              type="text" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="celular">Celular</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-4 px-4 text-on-surface placeholder-on-surface-variant cursor-pointer" 
              id="celular" 
              placeholder="099 000 0000" 
              type="tel" 
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="correo">Correo</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-4 px-4 text-on-surface placeholder-on-surface-variant leading-tight cursor-pointer" 
              id="correo" 
              placeholder="usuario@ejemplo.com" 
              type="email" 
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Detalles del Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="marca">Marca</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-3 px-4 text-on-surface placeholder-on-surface-variant cursor-pointer" 
              id="marca" 
              placeholder="Ej: Toyota" 
              type="text" 
              value={carBrand}
              onChange={(e) => setCarBrand(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="modelo">Modelo</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-3 px-4 text-on-surface placeholder-on-surface-variant cursor-pointer" 
              id="modelo" 
              placeholder="Ej: Corolla" 
              type="text" 
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2 cursor-pointer" htmlFor="color">Color</label>
            <input 
              className="block w-full bg-surface-container-lowest rounded-lg border border-outline shadow-sm focus:border-primary focus:ring-primary text-base py-3 px-4 text-on-surface placeholder-on-surface-variant cursor-pointer" 
              id="color" 
              placeholder="Ej: Rojo" 
              type="text" 
              value={carColor}
              onChange={(e) => setCarColor(e.target.value)}
            />
          </div>
        </div>

        <hr className="my-2 border-surface-variant" />

        {/* Sección de Próximo Servicio Obligatorio */}
        <div className={`rounded-xl p-5 border-2 transition-colors ${nextMaintenanceReason ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-error-container border-error text-on-error-container'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                Próximo Servicio <span className="text-xs ml-1 uppercase font-black bg-error text-on-error px-2 py-0.5 rounded-full">Obligatorio</span>
              </h3>
              {nextMaintenanceReason ? (
                <p className="text-sm mt-1">
                  <strong>Motivo:</strong> {nextMaintenanceReason}
                  <br />
                  <strong>Fecha:</strong> {nextMaintenanceDate || 'Sin fecha sugerida'}
                </p>
              ) : (
                <p className="text-sm mt-1 opacity-80">Debe asignar el próximo servicio recomendado al cliente.</p>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenRecommendationModal}
              className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors ${nextMaintenanceReason ? 'bg-surface text-primary hover:bg-surface-variant' : 'bg-error text-on-error hover:bg-error/80'}`}
            >
              {nextMaintenanceReason ? 'Editar' : 'Asignar'}
            </button>
          </div>
        </div>

        {/* Reception Status Card */}
        <div className="bg-surface-container rounded-xl p-5 flex items-center gap-4 mt-auto cursor-pointer">
          <div className="bg-surface-container-highest p-3 rounded-lg text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Estado de Recepción</h3>
            <p className="text-sm text-on-surface-variant">Inspección visual pendiente al ingresar</p>
          </div>
        </div>
      </form>
    </section>
  );
};
