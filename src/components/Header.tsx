import React from 'react';
import { ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  left: ReactNode;
  right?: ReactNode;
}

export default function Header({ left, right }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 bg-background shadow z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">{left}</div>
        <div className="flex items-center gap-2">
          {right}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-foreground hover:text-background transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}