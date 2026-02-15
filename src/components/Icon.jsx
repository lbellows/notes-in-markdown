import React from 'react';

function Svg({ children, size = 14 }) {
  return (
    <svg
      className="icon-svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function Icon({ name, size = 14 }) {
  switch (name) {
    case 'file':
      return (
        <Svg size={size}>
          <path d="M6 2h8l5 5v15H6z" />
          <path d="M14 2v5h5" />
        </Svg>
      );
    case 'folder':
      return (
        <Svg size={size}>
          <path d="M3 7h6l2 2h10v11H3z" />
        </Svg>
      );
    case 'home':
      return (
        <Svg size={size}>
          <path d="M3 11.5L12 4l9 7.5" />
          <path d="M6 10.5V20h12v-9.5" />
        </Svg>
      );
    case 'filePlus':
      return (
        <Svg size={size}>
          <path d="M6 2h8l5 5v15H6z" />
          <path d="M14 2v5h5" />
          <path d="M12 12v6" />
          <path d="M9 15h6" />
        </Svg>
      );
    case 'folderPlus':
      return (
        <Svg size={size}>
          <path d="M3 7h6l2 2h10v11H3z" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </Svg>
      );
    case 'rename':
      return (
        <Svg size={size}>
          <path d="M4 20l4-1 10-10-3-3L5 16z" />
          <path d="M14 5l3 3" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg size={size}>
          <path d="M4 7h16" />
          <path d="M8 7V4h8v3" />
          <path d="M8 7v13h8V7" />
          <path d="M11 10v7" />
          <path d="M13 10v7" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg size={size}>
          <path d="M20 6v5h-5" />
          <path d="M4 18v-5h5" />
          <path d="M20 11a8 8 0 0 0-13-5" />
          <path d="M4 13a8 8 0 0 0 13 5" />
        </Svg>
      );
    case 'save':
      return (
        <Svg size={size}>
          <path d="M4 4h14l2 2v14H4z" />
          <path d="M7 4v6h8V4" />
          <path d="M8 20v-5h8v5" />
        </Svg>
      );
    case 'saveAll':
      return (
        <Svg size={size}>
          <path d="M7 4h11l2 2v12H7z" />
          <path d="M4 7h1v13h11" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg size={size}>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M4.6 6.1l2.1 2.1" />
          <path d="M17.3 16.8l2.1 2.1" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="M4.6 17.9l2.1-2.1" />
          <path d="M17.3 7.2l2.1-2.1" />
          <circle cx="12" cy="12" r="3.2" />
        </Svg>
      );
    case 'close':
      return (
        <Svg size={size}>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </Svg>
      );
    default:
      return null;
  }
}
