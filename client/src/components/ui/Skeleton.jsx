/**
 * ===========================================
 * Skeleton Components
 * ===========================================
 * 
 * Skeleton loading components for displaying
 * placeholder content while data is loading.
 */

import clsx from 'clsx';

/**
 * Base skeleton component with shimmer animation
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  );
}

/**
 * Film card skeleton matching FilmCard layout
 */
function FilmCardSkeleton() {
  return (
    <div className="card">
      {/* Poster skeleton */}
      <div className="relative aspect-video bg-muted -mx-6 -mt-6 mb-4 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
        {/* Status badge skeleton */}
        <Skeleton className="absolute top-2 right-2 w-16 h-5 rounded-full" />
      </div>

      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4 mb-2" />
      
      {/* Genre tags skeleton */}
      <div className="flex gap-1 mb-4">
        <Skeleton className="h-5 w-14 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
      </div>

      {/* Funding progress skeleton */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between mt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}

/**
 * Grid of film card skeletons
 */
function FilmGridSkeleton({ count = 3 }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <FilmCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { Skeleton, FilmCardSkeleton, FilmGridSkeleton };
export default Skeleton;
