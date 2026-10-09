import type { InputHTMLAttributes, ReactNode } from 'react';
import { PLACES } from '../lib/options';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
}

export function TextField({ id, label, value, onChange, error, hint, className = '', ...rest }: FieldProps) {
  const describedBy = [error ? `${id}-greska` : null, hint ? `${id}-pomoc` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' has-error' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <p className="field__hint" id={`${id}-pomoc`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-greska`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function PlacesDatalist() {
  return (
    <datalist id="mjesta-montaze">
      {PLACES.map((p) => (
        <option key={p} value={p} />
      ))}
    </datalist>
  );
}
