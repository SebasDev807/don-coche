interface RegistrationFormProps {
  plate: string;
  setPlate: (val: string) => void;
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
}

export const RegistrationForm = ({
  plate, setPlate,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  customerEmail, setCustomerEmail,
  carBrand, setCarBrand,
  carModel, setCarModel,
  carColor, setCarColor
}: RegistrationFormProps) => {
  return (
    <section className="w-full md:w-2/5 bg-surface-container-lowest border-r border-surface-variant p-8 flex flex-col overflow-y-auto" data-purpose="registration-form">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">Registro de Vehículo</h1>
        <p className="text-on-surface-variant text-base leading-relaxed">Ingrese los detalles para iniciar una nueva orden de servicio.</p>
      </div>
      <form className="flex-1 flex flex-col gap-6">
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
        <div>
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
