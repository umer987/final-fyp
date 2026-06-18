import React from 'react';

export function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1FAA59]/30 border-t-[#1FAA59] rounded-full animate-spin" />
    </div>
  );
}
