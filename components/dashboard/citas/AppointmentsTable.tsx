'use client';

import { useState } from 'react';
import type { AppointmentDTO } from '@/actions/appointments';
import { updateAppointmentStatus, rescheduleAppointment } from '@/actions/appointments/core.actions';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Propiedades del componente AppointmentsTable.
 */
interface AppointmentsTableProps {
  /** Array de citas serializadas para poblar la tabla */
  appointments: AppointmentDTO[];
}

/**
 * Mapeo de cada estado de cita a sus clases CSS de badge y etiqueta legible.
 */
const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  PENDIENTE: {
    label: 'Pendiente',
    classes: 'text-amber-700 bg-amber-50',
    dot: 'bg-amber-500',
  },
  CUMPLIDA: {
    label: 'Cumplida',
    classes: 'text-emerald-700 bg-emerald-50',
    dot: 'bg-emerald-500',
  },
  PERDIDA: {
    label: 'Perdida',
    classes: 'text-red-700 bg-red-50',
    dot: 'bg-red-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    classes: 'text-gray-600 bg-gray-100',
    dot: 'bg-gray-400',
  },
};

/**
 * Tabla de solo lectura que muestra el listado de citas agendadas.
 *
 * Diseño consistente con {@link StaffTable}: mismos tokens de color,
 * tipografía y paginación. Columnas: Cliente, Vehículo, Fecha Programada,
 * Descripción y Estado (badge semántico).
 *
 * @param {AppointmentsTableProps} props - Propiedades con el array de citas.
 * @returns {JSX.Element} El componente de la tabla de citas.
 */
export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const paginatedAppointments = appointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /**
   * Formatea una fecha a texto legible local colombiano.
   * @param date - La fecha a formatear.
   * @returns String con formato "dd MMM yyyy, hh:mm a".
   */
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(date))
      .replace(/\u202F|\u00A0/g, ' ');
  };

  /**
   * Determina si una cita pendiente está próxima (dentro de las próximas 24h).
   */
  const isUpcoming = (apt: AppointmentDTO): boolean => {
    if (apt.status !== 'PENDIENTE') return false;
    const now = new Date();
    const scheduled = new Date(apt.scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-highest overflow-hidden">
      <div className="overflow-x-auto min-h-[520px]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">
                Cliente
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">
                Vehículo
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">
                Fecha Programada
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">
                Descripción
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">
                Estado
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider">
                Agendado por
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-secondary uppercase text-xs tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-md text-on-surface">
            {paginatedAppointments.map((apt) => {
              const statusCfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.PENDIENTE;
              const upcoming = isUpcoming(apt);

              return (
                <tr
                  key={apt.id}
                  className={`hover:bg-surface-container-lowest/50 transition-colors ${
                    upcoming ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Cliente */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-on-surface shrink-0">
                        {apt.customerName?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="font-medium truncate max-w-[180px]"
                          title={apt.customerName ?? 'Sin nombre'}
                        >
                          {apt.customerName ?? 'Sin nombre'}
                        </span>
                        {apt.customerPhone && (
                          <span className="text-xs text-secondary truncate">
                            {apt.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Vehículo */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold text-on-surface">
                        {apt.vehiclePlate}
                      </span>
                      {(apt.vehicleBrand || apt.vehicleModel) && (
                        <span className="text-xs text-secondary">
                          {[apt.vehicleBrand, apt.vehicleModel].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Fecha Programada */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {upcoming && (
                        <span
                          className="material-symbols-outlined text-amber-500 text-[18px] animate-pulse"
                          title="Próxima en las siguientes 24h"
                        >
                          schedule
                        </span>
                      )}
                      <span className={upcoming ? 'font-semibold text-amber-700' : 'text-secondary'}>
                        {formatDateTime(apt.scheduledAt)}
                      </span>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="py-4 px-6">
                    <span
                      className="text-secondary truncate block max-w-[200px]"
                      title={apt.description ?? ''}
                    >
                      {apt.description || '—'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.classes}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Agendado por */}
                  <td className="py-4 px-6 text-secondary">
                    {apt.createdByName ?? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                        WhatsApp
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={async () => {
                          const result = await MySwal.fire({
                            title: '¿Confirmar Cita?',
                            text: 'Se marcará la cita como cumplida.',
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, confirmar',
                            cancelButtonText: 'Cancelar',
                          });
                          if (result.isConfirmed) {
                            const res = await updateAppointmentStatus(apt.id, 'CUMPLIDA');
                            if (res.success) {
                              MySwal.fire('¡Confirmada!', 'La cita ha sido marcada como cumplida.', 'success');
                            } else {
                              MySwal.fire('Error', res.message || 'No se pudo confirmar la cita.', 'error');
                            }
                          }
                        }}
                        className="p-2 text-emerald-600 transition-colors cursor-pointer"
                        title="Confirmar (Marcar como cumplida)"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                      <button
                        onClick={async () => {
                          const { value: newDateStr } = await MySwal.fire({
                            title: 'Reprogramar Cita',
                            html: '<input type="datetime-local" id="swal-input-date" class="swal2-input">',
                            focusConfirm: false,
                            showCancelButton: true,
                            confirmButtonText: 'Guardar',
                            cancelButtonText: 'Cancelar',
                            preConfirm: () => {
                              const input = document.getElementById('swal-input-date') as HTMLInputElement;
                              return input.value;
                            }
                          });

                          if (newDateStr) {
                            const newDate = new Date(newDateStr);
                            const res = await rescheduleAppointment(apt.id, newDate);
                            if (res.success) {
                              MySwal.fire('¡Reprogramada!', 'La cita ha sido reprogramada.', 'success');
                            } else {
                              MySwal.fire('Error', res.message || 'No se pudo reprogramar la cita.', 'error');
                            }
                          }
                        }}
                        className="p-2 text-primary transition-colors cursor-pointer"
                        title="Reprogramar cita"
                      >
                        <span className="material-symbols-outlined">event_note</span>
                      </button>
                      <button
                        onClick={async () => {
                          const result = await MySwal.fire({
                            title: '¿Cancelar Cita?',
                            text: 'Esta acción no se puede deshacer.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            confirmButtonText: 'Sí, cancelar cita',
                            cancelButtonText: 'No, mantenerla',
                          });
                          if (result.isConfirmed) {
                            const res = await updateAppointmentStatus(apt.id, 'CANCELADA');
                            if (res.success) {
                              MySwal.fire('Cancelada', 'La cita ha sido cancelada.', 'success');
                            } else {
                              MySwal.fire('Error', res.message || 'No se pudo cancelar la cita.', 'error');
                            }
                          }
                        }}
                        className="p-2 text-error transition-colors cursor-pointer"
                        title="Cancelar cita"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {appointments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-secondary">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-surface-variant">
                      event_available
                    </span>
                    <span>No hay citas que coincidan con los filtros seleccionados.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {appointments.length > 0 && (
        <div className="bg-surface border-t border-outline-variant p-4 flex items-center justify-between">
          <p className="text-sm text-secondary">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, appointments.length)} de {appointments.length}{' '}
            citas
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="cursor-pointer p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-2 border border-outline-variant rounded hover:bg-surface-container text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
