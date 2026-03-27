import { CheckCircle2, CircleAlert, Info, type LucideIcon } from 'lucide-react';
import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

const AUTO_DISMISS_MS = 3000;
const EXIT_ANIMATION_MS = 220;
const MAX_VISIBLE_TOASTS = 3;

export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  toast: (payload: ToastPayload) => void;
}

export interface ToastProviderProps {
  children: ReactNode;
}

interface ToastRecord extends ToastPayload {
  id: number;
  isLeaving: boolean;
}

interface ToastTimerHandles {
  dismissTimeout: number;
  removeTimeout?: number;
}

interface ToastStyle {
  icon: LucideIcon;
  iconClassName: string;
  role: 'alert' | 'status';
}

export interface ToastProps {
  toast: ToastRecord;
}

const toastStyles: Record<ToastType, ToastStyle> = {
  success: {
    icon: CheckCircle2,
    iconClassName:
      'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-300',
    role: 'status',
  },
  error: {
    icon: CircleAlert,
    iconClassName: 'bg-rose-500/12 text-rose-700 dark:bg-rose-500/18 dark:text-rose-300',
    role: 'alert',
  },
  info: {
    icon: Info,
    iconClassName: 'bg-sky-500/12 text-sky-700 dark:bg-sky-500/18 dark:text-sky-300',
    role: 'status',
  },
};

export const ToastContext = createContext<ToastContextValue>({
  toast: (): void => undefined,
});

export default function Toast({ toast }: ToastProps): ReactElement {
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  return (
    <div
      aria-live={style.role === 'alert' ? 'assertive' : 'polite'}
      className={[
        'pointer-events-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-xl shadow-black/10 backdrop-blur',
        toast.isLeaving
          ? 'animate-[toast-out_220ms_ease-in_forwards]'
          : 'animate-[toast-in_220ms_ease-out]',
      ].join(' ')}
      role={style.role}
    >
      <div className="flex items-start gap-3">
        <div className={['mt-0.5 rounded-full p-2', style.iconClassName].join(' ')}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-6 text-[var(--color-text)]">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: ToastProviderProps): ReactElement {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextToastIdRef = useRef(1);
  const toastTimersRef = useRef<Map<number, ToastTimerHandles>>(new Map());

  const clearToastTimers = (toastId: number): void => {
    const timers = toastTimersRef.current.get(toastId);

    if (timers === undefined) {
      return;
    }

    window.clearTimeout(timers.dismissTimeout);

    if (timers.removeTimeout !== undefined) {
      window.clearTimeout(timers.removeTimeout);
    }

    toastTimersRef.current.delete(toastId);
  };

  const removeToast = (toastId: number): void => {
    clearToastTimers(toastId);
    setToasts((currentToasts) => currentToasts.filter((currentToast) => currentToast.id !== toastId));
  };

  const beginDismissToast = (toastId: number): void => {
    const timers = toastTimersRef.current.get(toastId);

    if (timers === undefined || timers.removeTimeout !== undefined) {
      return;
    }

    setToasts((currentToasts) =>
      currentToasts.map((currentToast) =>
        currentToast.id === toastId ? { ...currentToast, isLeaving: true } : currentToast,
      ),
    );

    timers.removeTimeout = window.setTimeout(() => {
      removeToast(toastId);
    }, EXIT_ANIMATION_MS);
    toastTimersRef.current.set(toastId, timers);
  };

  const toast = ({ message, type }: ToastPayload): void => {
    const normalizedMessage = message.trim();

    if (normalizedMessage.length === 0) {
      return;
    }

    const toastId = nextToastIdRef.current;
    nextToastIdRef.current += 1;

    setToasts((currentToasts) =>
      [
        ...currentToasts.slice(-(MAX_VISIBLE_TOASTS - 1)),
        { id: toastId, isLeaving: false, message: normalizedMessage, type },
      ].slice(-MAX_VISIBLE_TOASTS),
    );

    toastTimersRef.current.set(toastId, {
      dismissTimeout: window.setTimeout(() => {
        beginDismissToast(toastId);
      }, AUTO_DISMISS_MS),
    });
  };

  useEffect(() => {
    const toastTimers = toastTimersRef.current;

    return () => {
      for (const timers of toastTimers.values()) {
        window.clearTimeout(timers.dismissTimeout);

        if (timers.removeTimeout !== undefined) {
          window.clearTimeout(timers.removeTimeout);
        }
      }

      toastTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
          {toasts.map((currentToast) => (
            <Toast key={currentToast.id} toast={currentToast} />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
