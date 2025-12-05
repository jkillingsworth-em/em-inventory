import React from 'react';

export const BarcodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125V4.875ZM9 3.75c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v15.5c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125V3.75Zm6.375 0c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v15.5c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125V3.75Z"
    />
  </svg>
);
