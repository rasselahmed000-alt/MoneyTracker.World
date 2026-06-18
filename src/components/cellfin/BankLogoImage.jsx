import { useState } from 'react';
import { Building2 } from 'lucide-react';

export default function BankLogoImage({ 
  logoUrl, 
  bankName, 
  shortCode,
  className = "w-8 h-8",
  containerClassName = "rounded-lg",
  showFallback = true,
  fallbackBg = "bg-slate-700",
  fallbackTextColor = "text-white"
}) {
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) {
    if (!showFallback) return null;
    
    return (
      <div className={`${containerClassName} ${fallbackBg} flex items-center justify-center overflow-hidden ${className}`}>
        {shortCode || bankName ? (
          <span className={`${fallbackTextColor} text-[10px] font-extrabold`}>
            {(shortCode || bankName || '?')[0]}
          </span>
        ) : (
          <Building2 size={16} className={fallbackTextColor} />
        )}
      </div>
    );
  }

  return (
    <div className={`${containerClassName} overflow-hidden ${className}`}>
      <img 
        src={logoUrl} 
        alt={bankName || 'Bank Logo'} 
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}