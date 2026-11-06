'use client';

import React from 'react';

export type OrderLifecycleStatus =
  | 'Pending'
  | 'Processing'
  | 'Designing'
  | 'Printed'
  | 'Dispatched'
  | 'Delivered'
  | 'Completed'
  | 'Rejected';

const STEPS: { key: string; labelMl: string; labelEn: string; icon: string }[] = [
  { key: 'Pending', labelMl: 'പെൻഡിംഗ്', labelEn: 'Pending', icon: '📥' },
  { key: 'Processing', labelMl: 'പ്രോഗ്രസിംഗ്', labelEn: 'Processing', icon: '⚙️' },
  { key: 'Designing', labelMl: 'ഡിസൈനിംഗ്', labelEn: 'Designing', icon: '🎨' },
  { key: 'Dispatched', labelMl: 'ഡിസ്പാച്ച്ഡ്', labelEn: 'Dispatched', icon: '🚚' },
  { key: 'Delivered', labelMl: 'ഡെലിവേർഡ്', labelEn: 'Delivered', icon: '✅' },
];

export function getStatusIndex(status: string): number {
  switch (status) {
    case 'Pending':
      return 0;
    case 'Processing':
      return 1;
    case 'Designing':
    case 'Printed':
      return 2;
    case 'Dispatched':
      return 3;
    case 'Delivered':
    case 'Completed':
      return 4;
    case 'Rejected':
      return -1;
    default:
      return 0;
  }
}

export default function OrderStatusTracker({ status }: { status: string }) {
  const activeIndex = getStatusIndex(status);

  if (status === 'Rejected') {
    return (
      <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
        <span>❌</span>
        <span>അപേക്ഷ നിരസിച്ചിരിക്കുന്നു (Rejected). കൂടുതൽ വിവരങ്ങൾക്ക് ഓഫീസുമായി ബന്ധപ്പെടുക.</span>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/80">
      <div className="flex items-center justify-between relative">
        {/* Progress Background Line */}
        <div className="absolute left-4 right-4 top-4 h-1 bg-slate-200 -z-0 rounded-full" />
        <div
          className="absolute left-4 top-4 h-1 bg-emerald-500 -z-0 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, (activeIndex / (STEPS.length - 1)) * 90)}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center text-center w-16">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-emerald-500/25 scale-110' : ''}`}
              >
                {step.icon}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-extrabold leading-tight ${
                  isDone ? 'text-emerald-900' : 'text-slate-400'
                }`}
              >
                {step.labelMl}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">{step.labelEn}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
