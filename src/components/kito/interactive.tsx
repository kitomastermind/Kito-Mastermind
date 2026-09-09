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
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          'size-11 shrink-0 rounded-full border border-line',
          checked && 'bg-secondary-pale',
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
    <p className="rounded-[4px] bg-cream-dim px-3 py-2 text-sm text-muted">
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
              ? 'border-secondary bg-secondary-pale text-primary'
              : 'border-line text-muted',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-[6px] border border-line bg-cream p-5">
        <h2 className="font-display text-xl text-primary">{title}</h2>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="h-11 rounded-[4px] px-3" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'h-11 rounded-[4px] px-3 font-semibold',
              destructive ? 'bg-danger-pale text-danger-ink' : 'bg-secondary text-primary-deep',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
