import React from 'react';

/**
 * 全局背景效果，支持半透明+毛玻璃效果
 */
export const Background: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 h-screen w-screen bg-black/30 backdrop-blur-xl dark:bg-black/70">
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};
