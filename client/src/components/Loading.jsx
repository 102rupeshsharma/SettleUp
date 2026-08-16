import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    </div>
  );
}
