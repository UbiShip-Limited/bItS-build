import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onNavigate: (direction: number) => void;
  onToday: () => void;
  onViewMode: (mode: 'month' | 'week') => void;
  onRefresh?: () => void;
}

export const useKeyboardShortcuts = ({
  onNavigate,
  onToday,
  onViewMode,
  onRefresh
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onNavigate(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNavigate(1);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          onToday();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          onViewMode('month');
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          onViewMode('week');
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onRefresh?.();
          }
          break;
        case 'Escape':
          // Close any open modals or menus
          const event = new CustomEvent('calendar:escape');
          document.dispatchEvent(event);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onNavigate, onToday, onViewMode, onRefresh]);

  // Auto-refresh functionality (disabled for now to prevent API overload)
  // useEffect(() => {
  //   if (!onRefresh) return;

  //   const interval = setInterval(() => {
  //     onRefresh();
  //   }, 5 * 60 * 1000); // Refresh every 5 minutes

  //   return () => clearInterval(interval);
  // }, [onRefresh]);
}; 