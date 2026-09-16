'use client';

import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ACTION_ICONS } from '@/constants/icons';
import { deleteProduct } from '@/actions/inventory/deleteProduct.actions';
import { useState } from 'react';

const MySwal = withReactContent(Swal);

export function DeleteProductDetailButton({ id, userRole }: { id: string, userRole?: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  if (userRole === 'AUXILIAR_ADMINISTRATIVO') {
    return null;
  }

  const handleDelete = async () => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: "¿Estas seguro que deseas eliminar este prducto?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-error)',
      cancelButtonColor: 'var(--color-outline)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold shadow-sm',
        cancelButton: 'rounded-lg font-bold'
      }
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      const res = await deleteProduct(id);
      
      if (res.success) {
        await MySwal.fire({
          title: 'Eliminado',
          text: 'El producto ha sido eliminado.',
          icon: 'success',
          confirmButtonColor: 'var(--color-primary)',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-lg font-bold'
          }
        });
        router.push('/inventario');
      } else {
        MySwal.fire({
          title: 'Error',
          text: res.message || 'No se pudo eliminar el producto.',
          icon: 'error',
          confirmButtonColor: 'var(--color-error)'
        });
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none bg-surface-container-high text-error hover:bg-error hover:text-white shadow-sm disabled:opacity-50"
      title="Eliminar Producto"
    >
      <span className="material-symbols-outlined text-[24px]">
        {isDeleting ? 'hourglass_empty' : ACTION_ICONS.delete}
      </span>
    </button>
  );
}
