'use client';

import { cn } from '@/lib/utils';

export function ActionItem({
  title,
  meta,
  checked,
  onToggle,
  pill,
  rightButton,
  strike,
}: {
  title: string;
  meta: string;
  checked: boolean;
  onToggle?: () => void;
  pill?: React.ReactNode;
  rightButton?: React.ReactNode;
  strike?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#204559]/8 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={checked ? `Completed: ${title}` : `Mark complete: ${title}`}
        onClick={onToggle}
        className={cn(
          'size-11 shrink-0 rounded-md border border-[#204559]/10',
          checked && 'bg-[#EEF1D6]',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm text-ink', strike && 'text-muted line-through')}>{title}</p>
        <p className="text-xs text-muted">{meta}</p>
      </div>
      {pill}
      {rightButton}
    </div>
  );
}

export function LockStrip({ ownerFirstName }: { ownerFirstName: string }) {
  return (
    <p className="rounded-lg bg-[#F7FAF6] px-3 py-2 text-sm text-[#5A6B7D]">
      Client contact details are hidden until {ownerFirstName} approves access
    </p>
  );
}

export function FilterChipRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'h-11 rounded-full border px-3 text-sm',
            value === option.id
              ? 'border-[#9BA63E] bg-[#9BA63E] text-[#204559]'
              : 'border-[#204559]/10 text-[#5A6B7D]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex gap-3">
      {steps.map((step, index) => (
        <li
          key={step}
          className={cn(
            'text-sm',
            index === current && 'font-semibold text-primary',
            index < current && 'text-secondary-deep',
            index > current && 'text-muted',
          )}
        >
          {index + 1}. {step}
        </li>
      ))}
    </ol>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  destructive,
  open,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="animate-fade-in w-full rounded-xl border border-[#204559]/10 bg-white p-5 sm:max-w-md"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#204559]/15 sm:hidden" />
        <h2 className="text-base font-bold text-[#204559]">{title}</h2>
        <p className="mt-2 text-sm text-[#5A6B7D]">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary min-h-[48px]" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'min-h-[48px] rounded-2xl px-5 text-sm font-bold',
              destructive ? 'bg-destructive text-white' : 'btn-primary',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
