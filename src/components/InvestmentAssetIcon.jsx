import React, { useState } from 'react';

const InvestmentAssetIcon = ({ asset, className = 'size-11' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  // Reemplazar versiones pequeñas por 'large'
  const image = asset?.image?.replace('/thumb/', '/large/').replace('/small/', '/large/');
  const symbol = asset?.symbol || asset?.name || '?';

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-emerald-500/20 text-xs font-bold uppercase text-emerald-200 ring-1 ring-white/10 ${className}`}>
      {image && !imageFailed ? (
        <img
          src={image}
          alt=""
          className="size-full rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{symbol.slice(0, 2)}</span>
      )}
    </span>
  );
};

export default InvestmentAssetIcon;