import React from 'react';

// Shared frame for the sign-in, sign-up and password screens.
const AuthShell = ({ children }) => (
  <div className="flex min-h-[calc(100vh-7.5rem)] items-start justify-center px-4 py-10 sm:items-center sm:py-14">
    <div className="panel w-full max-w-sm p-6 sm:p-8">{children}</div>
  </div>
);

export default AuthShell;
