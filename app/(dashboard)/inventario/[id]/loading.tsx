export default function LoadingProductDetail() {
  return (
    <div className="fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <main className="flex-grow flex flex-col max-w-[1440px] mx-auto w-full">
        {/* Navigation Breadcrumb Skeleton */}
        <div className="mb-6 flex items-center">
          <div className="h-6 w-40 bg-surface-container-highest rounded animate-pulse"></div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
          {/* Left Side: Image Skeleton */}
          <div className="w-full md:w-2/5 relative min-h-[400px] flex items-center justify-center p-4 bg-white border-b md:border-b-0 md:border-r border-outline-variant">
            <div className="w-64 h-64 bg-surface-container-low rounded-full animate-pulse opacity-50"></div>
          </div>

          {/* Right Side: Product Details Skeleton */}
          <div className="w-full md:w-3/5 p-8 flex flex-col relative bg-surface">
            <div className="flex justify-between items-start mb-6">
              <div className="w-full">
                {/* Category Badge Skeleton */}
                <div className="h-6 w-24 bg-surface-container-highest rounded-full animate-pulse mb-4"></div>
                {/* Title Skeleton */}
                <div className="h-10 w-3/4 bg-surface-container-highest rounded animate-pulse mb-3"></div>
                {/* Code Skeleton */}
                <div className="h-5 w-1/3 bg-surface-container-highest rounded animate-pulse"></div>
              </div>
              {/* Edit Button Skeleton */}
              <div className="w-12 h-12 bg-surface-container-highest rounded-full animate-pulse flex-shrink-0"></div>
            </div>

            {/* Metrics Grid Skeleton */}
            <div className="grid grid-cols-2 gap-6 mb-8 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-surface-container-highest rounded animate-pulse"></div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse"></div>
                <div className="h-8 w-32 bg-surface-container-highest rounded animate-pulse"></div>
              </div>

              <div className="flex flex-col col-span-2 pt-4 border-t border-outline-variant/60 mt-2 gap-2">
                <div className="h-4 w-32 bg-surface-container-highest rounded animate-pulse"></div>
                <div className="h-12 w-48 bg-surface-container-highest rounded animate-pulse"></div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="flex-grow mt-6">
              <div className="h-6 w-48 bg-surface-container-highest rounded animate-pulse mb-4"></div>
              <div className="bg-surface-container-low p-4 rounded-xl min-h-[100px] border border-outline-variant/40 flex flex-col gap-2">
                <div className="h-4 w-full bg-surface-container-highest rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-surface-container-highest rounded animate-pulse"></div>
                <div className="h-4 w-4/6 bg-surface-container-highest rounded animate-pulse"></div>
              </div>
            </div>

            {/* Info Box Skeleton */}
            <div className="mt-8">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 animate-pulse flex-shrink-0"></div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-4 w-full bg-surface-container-highest rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-surface-container-highest rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
