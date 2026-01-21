import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Button as UiButton } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Textarea as UiTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-card/95 backdrop-blur-md rounded-xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-border/50 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200",
          modalSizes[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// Bridge Components to maintain API compatibility while using new UI kit

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
  const mapVariant: Record<string, "default" | "secondary" | "ghost" | "destructive" | "outline"> = {
    primary: 'default',
    secondary: 'outline', // Improve secondary to be outline for better contrast usually
    ghost: 'ghost',
    danger: 'destructive',
  };

  const mapSize: Record<string, "default" | "sm" | "lg" | "icon"> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
  };

  return (
    <UiButton
      variant={mapVariant[variant] || 'default'}
      size={mapSize[size] || 'default'}
      className={className}
      {...props}
    >
      {children}
    </UiButton>
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
      {label && <label className="block text-sm font-medium text-foreground/80 mb-2">{label}</label>}
      <UiInput
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          props.readOnly && "opacity-80 bg-muted/50"
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-destructive font-medium animate-in slide-in-from-top-1">{error}</p>}
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
      {label && <label className="block text-sm font-medium text-foreground/80 mb-2">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom arrow could go here if we hid appearance */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6" /></svg>
        </div>
      </div>
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
      {label && <label className="block text-sm font-medium text-foreground/80 mb-2">{label}</label>}
      <UiTextarea {...props} />
    </div>
  );
}
