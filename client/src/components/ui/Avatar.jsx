import React from 'react';

const PALETTE = [
  ['#ead9c2', '#5c4424'],
  ['#d6e4d0', '#2f4b29'],
  ['#d5deee', '#2b3f64'],
  ['#edd5d9', '#6c2d38'],
  ['#e5dbef', '#4a3567'],
  ['#d2e6e5', '#24504f'],
];

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-11 w-11 text-sm',
};

const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const colorsFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return PALETTE[hash % PALETTE.length];
};

const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizeClass = SIZES[size] || SIZES.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const [bg, fg] = colorsFor(name);
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: bg, color: fg }}
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
};

export default Avatar;
