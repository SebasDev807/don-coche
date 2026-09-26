"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <span className="text-secondary text-sm text-center sm:text-left">
        Mostrando página {currentPage} de {totalPages}
        {totalCount !== undefined ? ` (${totalCount} resultados)` : ''}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center min-w-[40px] h-[40px]"
          title="Página anterior"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`
              flex items-center justify-center min-w-[40px] h-[40px] rounded-lg text-sm font-medium transition-colors
              ${
                page === currentPage
                  ? 'bg-primary-container text-on-primary-container border-primary-container font-bold'
                  : page === '...'
                  ? 'text-secondary cursor-default'
                  : 'border border-outline-variant text-secondary hover:bg-surface-container cursor-pointer'
              }
            `}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center min-w-[40px] h-[40px]"
          title="Siguiente página"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
