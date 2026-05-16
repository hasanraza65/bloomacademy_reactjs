import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function PdfSkeletonLoader() {
  return (
    <div className=" z-[9999] overflow-y-auto bg-slate-100">
      <div className="mx-auto rounded-xl bg-white p-10  min-h-[90vh]">
        
        {/* Title */}
        <Skeleton height={36} width="50%" />

        {/* Text */}
        <div className="mt-10 space-y-4">
          <Skeleton height={18} />
          <Skeleton height={18} width="92%" />
          <Skeleton height={18} width="85%" />
          <Skeleton height={18} width="70%" />
        </div>

        {/* Image / Chart block */}
        <div className="mt-10">
          <Skeleton height={300} borderRadius={16} />
        </div>

        {/* More text */}
        <div className="mt-10 space-y-4">
          <Skeleton height={18} />
          <Skeleton height={18} width="88%" />
          <Skeleton height={18} width="76%" />
          <Skeleton height={18} width="95%" />
        </div>

        {/* Footer */}
        <div className="mt-16 flex justify-between">
          <Skeleton height={18} width={100} />
          <Skeleton height={18} width={60} />
        </div>
      </div>
    </div>
  );
}