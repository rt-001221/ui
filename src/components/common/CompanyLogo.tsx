import React, { useState } from 'react';

interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName: string;
  clientCode?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  logoUrl,
  companyName,
  clientCode,
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState<boolean>(false);

  // Derive 1-3 letter initials from company name
  const initials = React.useMemo(() => {
    if (!companyName) return clientCode || 'CO';
    const clean = companyName.replace(/[^a-zA-Z0-9\s&]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clientCode || 'CO';
  }, [companyName, clientCode]);

  // Dimension classes matching Section 11 specifications:
  // - sm: 36x36px (compact lists / previews)
  // - md: 48x48px (table rows: directory & revenue tables: 44-52px)
  // - lg: 84x84px (mobile detail view)
  // - xl: 96x96px (desktop client detail header: 84-96px)
  const sizeClasses = {
    sm: 'w-9 h-9 min-w-[36px]',
    md: 'w-12 h-12 min-w-[48px]',
    lg: 'w-20 h-20 min-w-[80px]',
    xl: 'w-24 h-24 min-w-[96px]'
  }[size];

  const fontSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-base',
    xl: 'text-xl'
  }[size];

  const showImage = logoUrl && !hasError;

  return (
    <div
      className={`${sizeClasses} rounded-xl border overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-sm transition-all select-none ${className}`}
      style={{
        backgroundColor: 'var(--surface-input)',
        borderColor: 'var(--border-subtle)'
      }}
      title={`${companyName} (${clientCode || ''})`}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full rounded-lg flex flex-col items-center justify-center bg-[var(--surface-card)] text-[var(--accent-cyan-text)] font-mono-tech font-bold">
          <span className={`${fontSizeClasses} leading-none tracking-tight`}>{initials}</span>
          {size !== 'sm' && clientCode && (
            <span className="text-[9px] text-[var(--text-muted)] mt-0.5 opacity-80 leading-none">
              {clientCode}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
