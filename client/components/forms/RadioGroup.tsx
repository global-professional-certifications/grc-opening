export interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function RadioGroup({ options, value, onChange, className = '' }: RadioGroupProps) {
  return (
    <div
      className={`flex w-full overflow-hidden rounded-lg border text-sm ${className}`}
      style={{ borderColor: 'var(--db-border)' }}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 py-2.5 text-center font-medium border-r last:border-r-0 transition-all hover:opacity-80"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              borderColor: 'var(--db-border)',
              backgroundColor: isSelected ? 'var(--db-primary)' : 'transparent',
              color: isSelected ? '#0a0a0a' : 'var(--db-text-muted)',
              fontWeight: isSelected ? 700 : 500,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
