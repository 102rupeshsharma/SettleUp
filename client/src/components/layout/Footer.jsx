import React from 'react';

const Footer = () => (
  <footer className="border-t border-line">
    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 text-xs text-muted sm:px-6">
      <span>&copy; {new Date().getFullYear()} SettleUp</span>
      <span className="hidden sm:block">Shared costs, settled with the fewest payments.</span>
    </div>
  </footer>
);

export default Footer;
