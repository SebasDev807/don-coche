import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ACTION_ICONS } from '@/constants/icons';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Detalle del Producto | Don Coche',
  description: 'Información detallada del producto en inventario.',
};

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    include: {
      category_rel: true
    }
  });

  if (!product) {
    notFound();
  }
  
  const unitCost = Number(product.unitCost);
  const salePrice = Number(product.salePrice);
  const profitPercentage = product.profitPercentage ? Number(product.profitPercentage) : 0;
  
  const formattedUnitCost = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(unitCost);
  const formattedSalePrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(salePrice);

  const getIconForCategory = (categoryName: string) => {
    const cat = categoryName.toLowerCase();
    if (cat.includes('lubricante')) return 'oil_barrel';
    if (cat.includes('accesorio')) return 'extension';
    if (cat.includes('repuesto')) return 'settings_applications';
    return 'inventory_2';
  };

  const categoryName = product.category_rel?.name || product.category || 'Sin Categoría';
  
  // Use DB imageUrl or a generic Unsplash image for car parts/inventory
  const imageUrl = product.imageUrl || 'https://images.unsplash.com/photo-1530906358829-e84b2769270f?q=80&w=1000&auto=format&fit=crop';

  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1000px] mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href={`/inventario`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-label-lg">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Volver al Inventario
          </Link>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
          {/* Left Side: Unsplash Image Container */}
          <div className="w-full md:w-2/5 relative min-h-[350px] bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant group">
            {/* Img as background cover to avoid next/image domain configuration issues, 
                or we can just use an img tag for external domains if next/image isn't configured */}
            <img 
              src={imageUrl} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end">
               <span className="inline-flex items-center justify-center bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm border border-white/20">
                 <span className="material-symbols-outlined text-[16px] mr-1.5">{getIconForCategory(categoryName)}</span>
                 {categoryName}
               </span>
            </div>
          </div>

          {/* Right Side: Product Details */}
          <div className="w-full md:w-3/5 p-8 flex flex-col relative bg-surface">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-md font-bold mb-3 border border-secondary/20 font-mono">
                  SKU: {product.code || 'N/A'}
                </span>
                <h1 className="font-headline-lg text-on-surface leading-tight mb-2">
                  {product.name}
                </h1>
              </div>
              <Link
                href={`/inventario/editar/${product.id}`}
                className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary shadow-sm"
                title="Editar Producto"
              >
                <span className="material-symbols-outlined text-[24px]">{ACTION_ICONS.edit}</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60">
              <div className="flex flex-col">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                  Stock Actual
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-title-lg ${product.stock <= 10 ? 'text-error' : 'text-on-surface'}`}>
                    {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                  </span>
                  {product.stock <= 10 && (
                     <span className="bg-error/10 text-error text-[10px] uppercase font-bold px-2 py-0.5 rounded">Stock Bajo</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  Costo Unitario
                </span>
                <span className="font-title-lg text-on-surface">{formattedUnitCost}</span>
              </div>

              {profitPercentage > 0 && (
                <div className="flex flex-col col-span-2 pt-4 border-t border-outline-variant/60 mt-2">
                  <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    Margen de Ganancia Esperado
                  </span>
                  <span className="font-title-md text-tertiary font-bold bg-tertiary/10 px-2 py-0.5 rounded w-fit">
                    {profitPercentage}%
                  </span>
                </div>
              )}

              <div className="flex flex-col col-span-2 pt-4 border-t border-outline-variant/60 mt-2">
                <span className="text-label-sm text-primary uppercase tracking-wider mb-1 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">sell</span>
                  Precio de Venta (PVP)
                </span>
                <span className="font-display-sm text-primary font-black">{formattedSalePrice}</span>
              </div>
            </div>

            <div className="flex-grow mt-6">
               <h4 className="font-title-md text-on-surface mb-3 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[20px]">description</span>
                 Descripción del Producto
               </h4>
               <div className="bg-surface-container-low p-4 rounded-xl text-body-md text-on-surface-variant min-h-[100px] border border-outline-variant/40">
                 {product.description ? (
                   <p>{product.description}</p>
                 ) : (
                   <p className="italic opacity-60">No hay descripción disponible para este producto.</p>
                 )}
               </div>
            </div>

            <div className="mt-8">
               <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                 <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                 <p className="text-body-sm text-on-surface-variant">
                   El inventario se valora basándose en el costo unitario de compra actual ({formattedUnitCost}). 
                   El valor total en stock para este producto es de <strong className="text-on-surface">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(unitCost * product.stock)}</strong>.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
