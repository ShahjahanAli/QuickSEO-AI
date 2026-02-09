
import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />
);

export const OverviewSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center p-6 rounded-3xl border border-slate-100 bg-white">
          <SkeletonBox className="w-32 h-32 rounded-full mb-4" />
          <SkeletonBox className="w-24 h-4 mb-2" />
          <SkeletonBox className="w-16 h-2 mb-3" />
          <SkeletonBox className="w-full h-10" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <SkeletonBox className="w-48 h-6 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex gap-4">
            <SkeletonBox className="w-2 h-2 rounded-full mt-2" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="w-32 h-3" />
              <SkeletonBox className="w-3/4 h-5" />
              <SkeletonBox className="w-full h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <SkeletonBox className="w-full h-48 rounded-3xl" />
        <div className="bg-white rounded-3xl p-6 border border-slate-100">
          <SkeletonBox className="w-32 h-5 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between py-3">
              <SkeletonBox className="w-24 h-4" />
              <SkeletonBox className="w-12 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const KeywordsSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-6 gap-4">
      <SkeletonBox className="w-24 h-4" />
      <SkeletonBox className="w-16 h-4 mx-auto" />
      <SkeletonBox className="w-16 h-4" />
      <SkeletonBox className="w-24 h-4" />
      <SkeletonBox className="w-12 h-4 ml-auto" />
    </div>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-slate-50 last:border-0">
        <SkeletonBox className="w-32 h-5" />
        <SkeletonBox className="w-8 h-8 rounded-full mx-auto" />
        <SkeletonBox className="w-12 h-4" />
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-16 h-1.5 rounded-full" />
          <SkeletonBox className="w-6 h-3" />
        </div>
        <SkeletonBox className="w-12 h-6 rounded-full ml-auto" />
      </div>
    ))}
  </div>
);

export const ResearchSkeleton: React.FC = () => (
  <div className="space-y-12">
    <section>
      <SkeletonBox className="w-48 h-6 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex justify-between mb-4">
              <SkeletonBox className="w-2/3 h-6" />
              <SkeletonBox className="w-10 h-4" />
            </div>
            <div className="flex gap-6 mb-4">
              <div className="space-y-1"><SkeletonBox className="w-12 h-2"/><SkeletonBox className="w-16 h-4"/></div>
              <div className="space-y-1"><SkeletonBox className="w-12 h-2"/><SkeletonBox className="w-16 h-4"/></div>
            </div>
            <div className="pt-4 border-t border-slate-50 space-y-2">
              <SkeletonBox className="w-24 h-3"/>
              <SkeletonBox className="w-full h-8"/>
            </div>
          </div>
        ))}
      </div>
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <section>
        <SkeletonBox className="w-56 h-6 mb-6" />
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 border-b border-slate-50 last:border-0 space-y-2">
              <div className="flex justify-between"><SkeletonBox className="w-1/2 h-5"/><SkeletonBox className="w-12 h-3"/></div>
              <SkeletonBox className="w-full h-4"/>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SkeletonBox className="w-48 h-6 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3">
              <SkeletonBox className="w-16 h-3"/>
              <SkeletonBox className="w-2/3 h-5"/>
              <SkeletonBox className="w-full h-10"/>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);
