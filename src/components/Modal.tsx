import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md md:max-w-lg',
  lg: 'max-w-lg md:max-w-2xl lg:max-w-4xl',
  xl: 'max-w-xl md:max-w-3xl lg:max-w-6xl',
  full: 'max-w-full',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-float w-full ${modalSizes[size]} mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm',
    secondary: 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm', // 32px
    md: 'px-4 py-2.5 text-sm', // 40px
    lg: 'px-6 py-3.5', // 48px
  };

  return (
    <button
      className={`font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>}
      <input
        className={`w-full px-3 py-2.5 rounded-lg border ${error ? 'border-red-500 ring-2 ring-red-100' : 'border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          } outline-none transition-all`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  options,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>}
      <select
        className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({
  label,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>}
      <textarea
        className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
        {...props}
      />
    </div>
  );
}
