export const RegistrationForm = () => {
  return (
    <section className="w-full md:w-2/5 bg-white border-r border-gray-200 p-8 flex flex-col overflow-y-auto" data-purpose="registration-form">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Vehículo</h1>
        <p className="text-gray-500 text-base leading-relaxed">Ingrese los detalles para iniciar una nueva orden de servicio.</p>
      </div>
      <form className="flex-1 flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer" htmlFor="placa">Placa</label>
          <input 
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-4 px-4 text-gray-800 placeholder-gray-300 font-bold uppercase cursor-pointer" 
            id="placa" 
            placeholder="ABC-1234" 
            type="text" 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer" htmlFor="propietario">Nombre del Propietario</label>
          <input 
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-4 px-4 text-gray-800 placeholder-gray-400 cursor-pointer" 
            id="propietario" 
            placeholder="Nombre Completo" 
            type="text" 
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer" htmlFor="celular">Celular</label>
            <input 
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-4 px-4 text-gray-800 placeholder-gray-400 cursor-pointer" 
              id="celular" 
              placeholder="099 000 0000" 
              type="tel" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer" htmlFor="correo">Correo</label>
            <input 
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-4 px-4 text-gray-800 placeholder-gray-400 leading-tight cursor-pointer" 
              id="correo" 
              placeholder="usuario@ejemplo.com" 
              type="email" 
            />
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Reception Status Card */}
        <div className="bg-gray-100 rounded-xl p-5 flex items-center gap-4 mt-auto cursor-pointer">
          <div className="bg-gray-200 p-3 rounded-lg text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Estado de Recepción</h3>
            <p className="text-sm text-gray-500">Inspección visual pendiente al ingresar</p>
          </div>
        </div>
      </form>
    </section>
  );
};
