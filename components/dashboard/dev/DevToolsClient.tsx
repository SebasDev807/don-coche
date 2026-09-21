'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { wipeDevData, verifyDevPassword, deleteInactiveUsers, getDevCustomers, deleteCustomerCascade, deleteAllCustomersCascade, seedMockCustomers, seedMockProducts, deleteMockProducts, deleteAllProductsCascade, deleteAllPurchaseInvoicesAction } from '@/actions/dev/dev.actions';
export function DevToolsClient() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      const audio = new Audio('/advertencia.mp3');
      // Loop the audio for continuous warning, or just play once
      audio.play().catch((e) => console.warn('El navegador bloqueó la reproducción automática del audio.', e));

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Debes ingresar tu contraseña para desbloquear las opciones.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await verifyDevPassword(password);
      if (res.success) {
        setIsUnlocked(true);
        setErrorMsg('');
      } else {
        setErrorMsg(res.message);
        setPassword('');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de red al intentar verificar credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWipe = async () => {
    if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO? Esta acción borrará todas las órdenes, ventas y movimientos de la base de datos.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await wipeDevData(password); // Usamos el password guardado en el state
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de red al intentar ejecutar la acción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInactiveUsers = async () => {
    if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO? Esta acción borrará permanentemente a los usuarios inactivos.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await deleteInactiveUsers(password);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de red al intentar ejecutar la acción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCustomerModal = async () => {
    setIsCustomerModalOpen(true);
    setIsLoadingCustomers(true);
    try {
      const res = await getDevCustomers(password);
      if (res.success) {
        setCustomers(res.data);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al cargar clientes');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cliente y todos sus vehículos y citas?')) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCustomerCascade(password, id);
      if (res.success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al eliminar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllCustomers = async () => {
    if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO? Se borrarán TODOS los clientes, vehículos y citas.')) return;
    setIsSubmitting(true);
    try {
      const res = await deleteAllCustomersCascade(password);
      if (res.success) {
        setCustomers([]);
        setSuccessMsg(res.message);
        setIsCustomerModalOpen(false);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al eliminar todos los clientes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedMockCustomers = async () => {
    if (!confirm('¿Seguro que deseas inyectar 10 clientes mock en la base de datos?')) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await seedMockCustomers(password, 10);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al ejecutar la semilla de clientes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedMockProducts = async (type: 'ALMACEN' | 'INSUMO') => {
    if (!confirm(`¿Seguro que deseas inyectar 10 productos mock de tipo ${type} en la base de datos?`)) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await seedMockProducts(password, 10, type);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al ejecutar la semilla de productos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMockProducts = async () => {
    if (!confirm('¿Seguro que deseas eliminar todos los productos mock? Esta acción no se puede deshacer.')) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await deleteMockProducts(password);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al eliminar los productos mock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO? Esta acción eliminará permanentemente TODOS los productos de la base de datos, así como sus movimientos e items de venta asociados.')) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await deleteAllProductsCascade(password);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al eliminar todos los productos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllPurchaseInvoices = async () => {
    if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO? Esta acción eliminará permanentemente TODAS las facturas de compra y sus items. No afectará el stock actual de los productos, solo borrará el historial de facturas.')) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await deleteAllPurchaseInvoicesAction(password);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Error al eliminar las facturas de compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#7f1d1d] overflow-y-auto flex flex-col items-center justify-center p-4 text-white font-serif">
        <div className="flex flex-col items-center text-center space-y-6 w-full max-w-3xl py-10">
          <div className="flex items-center justify-center mb-2">
            <Image 
              src="/images/caution.png" 
              alt="Precaución" 
              width={160} 
              height={160} 
              className="drop-shadow-2xl"
              priority
            />
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-[0.2em] mb-4 text-white drop-shadow-md">
              Zona Restringida
            </h2>
            <p className="text-red-200 text-xl uppercase mb-4 tracking-[0.3em] font-bold">
              Modificación Directa del Núcleo
            </p>
            <p className="text-red-100/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-justify px-4">
              Esta sección está destinada exclusivamente al equipo de desarrollo. Sus herramientas pueden modificar datos y procesos críticos de producción. El uso, acceso o manipulación no autorizada, especialmente con fines malintencionados, puede ser registrado, investigado y dar lugar a acciones administrativas o legales. Si usted no es del equipo de desarrollo o accedió accidentalmente a este sitio, abandone esta sección inmediatamente.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full max-w-md pt-6 space-y-5">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-none border-2 border-red-900 bg-black/50 text-center text-2xl tracking-[0.5em] text-white placeholder:text-red-900/50 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all font-mono"
                placeholder="••••••••"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="bg-black/50 border-l-4 border-white text-white text-sm p-4 text-left font-sans shadow-inner">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-black hover:bg-black/80 text-white font-bold h-14 border-2 border-transparent hover:border-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.3em] shadow-2xl text-base cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-xl">key</span>
              )}
              {isSubmitting ? 'Verificando...' : 'Desbloquear'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- UNLOCKED STATE ---
  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 text-primary mb-6 border-b border-outline-variant pb-4">
          <span className="material-symbols-outlined text-2xl">developer_mode</span>
          <h2 className="text-xl font-bold">Opciones de Desarrollo Habilitadas</h2>
        </div>

        {errorMsg && (
          <div className="bg-error-container/30 border border-error/50 text-error text-sm p-4 rounded-xl flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined">error</span>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-[#ecfdf5] border border-[#10b981] text-[#065f46] text-sm p-4 rounded-xl flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined">check_circle</span>
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Tarjeta de Acción: Purgar Base de Datos */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Purgar Base de Datos</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Borrado en cascada (Órdenes, Ventas, Cuadres, Movimientos)</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Ejecuta una transacción masiva que elimina todos los registros operativos. Los catálogos de productos, servicios, clientes, vehículos y personal <strong>NO</strong> serán afectados. Ideal para limpiar datos de prueba antes de producción.
            </p>

            <button
              onClick={handleWipe}
              disabled={isSubmitting || !!successMsg}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">skull</span>
              Ejecutar Purga
            </button>
          </div>

          {/* Tarjeta de Acción: Eliminar Usuarios Inactivos */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">person_remove</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Limpiar Usuarios</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Elimina usuarios inactivos</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Elimina permanentemente de la base de datos a los usuarios que estén marcados como <strong>inactivos</strong>. Esta acción fallará de forma segura si los usuarios tienen registros operativos y no se ha purgado la base de datos previamente.
            </p>

            <button
              onClick={handleDeleteInactiveUsers}
              disabled={isSubmitting || !!successMsg}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">person_remove</span>
              Eliminar Usuarios Inactivos
            </button>
          </div>

          {/* Tarjeta de Acción: Eliminar Clientes */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">group_remove</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Eliminar Clientes</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Borrado en cascada de Mocks</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Despliega una lista para eliminar clientes de prueba (Mocks). Eliminar un cliente <strong>borrará también sus vehículos y citas</strong>. Esta acción fallará si el cliente tiene registros operativos.
            </p>

            <button
              onClick={handleOpenCustomerModal}
              disabled={isSubmitting || !!successMsg}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">group_remove</span>
              Ver Clientes a Eliminar
            </button>
          </div>

          {/* Tarjeta de Acción: Seed Clientes Mock */}
          <div className="bg-surface-container-lowest border border-[#10b981]/40 rounded-xl p-5 hover:border-[#10b981] hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-[#10b981] text-3xl">add_reaction</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Semilla de Clientes</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Generar 10 Clientes Mock</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Inyecta 10 clientes falsos a la base de datos, cada uno con 1 o 2 vehículos asociados aleatoriamente. Útil para hacer pruebas en el entorno de desarrollo y llenar los selectores.
            </p>

            <button
              onClick={handleSeedMockCustomers}
              disabled={isSubmitting || !!successMsg}
              className="w-full bg-[#ecfdf5] text-[#065f46] border border-[#10b981]/50 hover:bg-[#10b981] hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">add_reaction</span>
              Inyectar Clientes
            </button>
          </div>

          {/* Tarjeta de Acción: Seed Productos Mock */}
          <div className="bg-surface-container-lowest border border-[#10b981]/40 rounded-xl p-5 hover:border-[#10b981] hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-[#10b981] text-3xl">inventory_2</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Semilla de Productos</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Generar 10 Productos Mock</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Inyecta 10 productos falsos a la base de datos (con el nombre "MOCK"). Útil para probar paginación y llenado del inventario sin afectar la lógica contable real a largo plazo.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleSeedMockProducts('ALMACEN')}
                disabled={isSubmitting || !!successMsg}
                className="w-full bg-[#ecfdf5] text-[#065f46] border border-[#10b981]/50 hover:bg-[#10b981] hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                title="Generar 10 Productos para Almacén"
              >
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Almacén
              </button>
              
              <button
                onClick={() => handleSeedMockProducts('INSUMO')}
                disabled={isSubmitting || !!successMsg}
                className="w-full bg-[#f0fdf4] text-[#166534] border border-[#22c55e]/50 hover:bg-[#22c55e] hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                title="Generar 10 Productos como Insumos"
              >
                <span className="material-symbols-outlined text-[18px]">water_drop</span>
                Insumos
              </button>
            </div>
          </div>

          {/* Tarjeta de Acción: Eliminar Productos Mock */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">delete_sweep</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Limpiar Productos Mock</h3>
                <p className="text-xs text-error font-medium mt-1">Borrar inventario de prueba</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Elimina de forma segura todos los productos cuyo nombre inicie con "MOCK". (Fallará si los productos ya tienen ventas operativas asociadas).
            </p>

            <button
              onClick={handleDeleteMockProducts}
              disabled={isSubmitting}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Borrar Productos Mock
            </button>
          </div>

          {/* Tarjeta de Acción: Eliminar TODOS los Productos */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">production_quantity_limits</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Eliminar TODOS los Productos</h3>
                <p className="text-xs text-error font-medium mt-1">Borrado total del inventario</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Elimina de forma permanente <strong>todos</strong> los productos de la base de datos, incluyendo su historial de movimientos e items de venta. Útil para reiniciar el inventario desde cero.
            </p>

            <button
              onClick={handleDeleteAllProducts}
              disabled={isSubmitting}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Borrar Todos los Productos
            </button>
          </div>

          {/* Tarjeta de Acción: Eliminar TODAS las Facturas de Compra */}
          <div className="bg-surface-container-lowest border border-error/40 rounded-xl p-5 hover:border-error hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">receipt_long</span>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Eliminar Facturas de Compra</h3>
                <p className="text-xs text-error font-medium mt-1">Borrado total del historial de compras</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-6 flex-1">
              Elimina de forma permanente <strong>todas</strong> las facturas de compra registradas a proveedores. No revierte el stock que ya se haya sumado al inventario, solo limpia el historial y los items asociados.
            </p>

            <button
              onClick={handleDeleteAllPurchaseInvoices}
              disabled={isSubmitting}
              className="w-full bg-error/10 text-error border border-error/50 hover:bg-error hover:text-white font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Borrar Facturas de Compra
            </button>
          </div>

        </div>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="text-xl font-bold text-error flex items-center gap-2">
                  <span className="material-symbols-outlined">group_remove</span>
                  Gestión de Clientes (Desarrollo)
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">Borrado en cascada (Cliente -{'>'} Vehículo -{'>'} Cita)</p>
              </div>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-surface">
              {isLoadingCustomers ? (
                <div className="flex justify-center py-10">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">
                  No hay clientes en la base de datos.
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border border-outline-variant rounded-xl hover:bg-surface-container-lowest transition-colors">
                      <div>
                        <div className="font-bold text-on-surface">{c.name || 'Sin Nombre'} <span className="text-sm font-normal text-on-surface-variant ml-2">{c.cc ? `CC: ${c.cc}` : ''}</span></div>
                        <div className="text-sm text-on-surface-variant flex gap-4 mt-1">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">directions_car</span> {c._count?.vehicles || 0} Vehículos</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">event</span> {c._count?.appointments || 0} Citas</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        disabled={isSubmitting}
                        className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        title="Eliminar este cliente"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center">
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-6 py-2 rounded-lg font-bold border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handleDeleteAllCustomers}
                disabled={isSubmitting || isLoadingCustomers || customers.length === 0}
                className="px-6 py-2 rounded-lg font-bold bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                Eliminar Todos los Clientes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
