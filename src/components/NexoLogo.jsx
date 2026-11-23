import React from 'react';

const NexoLogo = ({ size = 20, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
    style={style}
  >
    {/* Pilar izquierdo con bisel inferior */}
    <path d="M4.5 3.5H8.6V15.2L4.5 20.5V3.5Z" fill="currentColor" />
    {/* Diagonal arquitectónica y pilar derecho */}
    <path d="M10.1 3.5L15.4 11.6V3.5H19.5V20.5H15.4L10.1 12.4V3.5Z" fill="currentColor" />
  </svg>
);

export default NexoLogo;