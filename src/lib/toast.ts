/**
 * Simple toast notification system using DaisyUI alerts
 * This replaces react-hot-toast to avoid adding another dependency
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private container: HTMLDivElement | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Delay initialization until DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initContainer());
      } else {
        this.initContainer();
      }
    }
  }

  private initContainer() {
    if (this.initialized || !document.body) return;
    
    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
    this.initialized = true;
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts));
    this.render();
  }

  private render() {
    if (!this.container) return;

    this.container.innerHTML = this.toasts
      .map(toast => {
        const alertClass = {
          success: 'alert-success',
          error: 'alert-error',
          info: 'alert-info',
          warning: 'alert-warning'
        }[toast.type];

        const icon = {
          success: '✓',
          error: '✕',
          info: 'ℹ',
          warning: '⚠'
        }[toast.type];

        return `
          <div class="alert ${alertClass} shadow-lg max-w-sm animate-slide-in">
            <span>${icon} ${toast.message}</span>
          </div>
        `;
      })
      .join('');
  }

  show(type: ToastType, message: string) {
    // Ensure container is initialized
    if (!this.initialized && typeof window !== 'undefined') {
      this.initContainer();
    }
    
    const id = Date.now().toString();
    const toast: Toast = { id, type, message };
    
    this.toasts.push(toast);
    this.notify();

    // Auto remove after 3 seconds
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.notify();
    }, 3000);
  }

  success(message: string) {
    this.show('success', message);
  }

  error(message: string) {
    this.show('error', message);
  }

  info(message: string) {
    this.show('info', message);
  }

  warning(message: string) {
    this.show('warning', message);
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Create singleton instance
const toastManager = new ToastManager();

// Export toast object with methods matching react-hot-toast API
export const toast = {
  success: (message: string) => toastManager.success(message),
  error: (message: string) => toastManager.error(message),
  info: (message: string) => toastManager.info(message),
  warning: (message: string) => toastManager.warning(message),
  // Alias for compatibility
  loading: (message: string) => toastManager.info(message),
  custom: (message: string) => toastManager.info(message)
};