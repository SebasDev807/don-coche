"use client";

import { useState } from "react";

import { Supplier } from "@prisma/client";
import { createSupplierAction } from "@/actions/suppliers/suppliers.actions";

export function ProveedoresClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nit: "",
    name: "",
    phone: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createSupplierAction(formData);

    if (result.success && result.data) {
      setSuppliers([...suppliers, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsModalOpen(false);
      setFormData({ nit: "", name: "", phone: "", email: "" });
    } else {
      setError(result.error || "Ocurrió un error.");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-title-lg font-medium">Lista de Proveedores</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-fixed text-black px-4 py-2 rounded-full hover:brightness-95 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Proveedor
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-8 text-center text-secondary">
          No hay proveedores registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-surface-container rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary-container text-on-primary-container rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">domain</span>
                </div>
                <div>
                  <h3 className="font-medium text-title-md">{supplier.name}</h3>
                  <p className="text-secondary text-body-md flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">description</span> NIT: {supplier.nit}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-2 border-t border-outline-variant pt-4">
                {supplier.phone && (
                  <p className="text-body-md flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">call</span> {supplier.phone}
                  </p>
                )}
                {supplier.email && (
                  <p className="text-body-md flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">mail</span> {supplier.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-lg">
            <h2 className="text-headline-sm mb-6">Nuevo Proveedor</h2>
            
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-body-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-body-sm text-secondary mb-1">NIT / RUT *</label>
                <input
                  required
                  type="text"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Razón Social *</label>
                <input
                  required
                  type="text"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Teléfono</label>
                <input
                  type="text"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-body-sm text-secondary mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary focus:outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 rounded-full bg-primary-fixed text-black hover:brightness-95 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
