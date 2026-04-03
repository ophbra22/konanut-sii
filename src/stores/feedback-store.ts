import { create } from 'zustand';

type ToastTone = 'error' | 'info' | 'success';

type FeedbackState = {
  hideToast: () => void;
  isVisible: boolean;
  message: string | null;
  showToast: (message: string, tone?: ToastTone) => void;
  tone: ToastTone;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useFeedbackStore = create<FeedbackState>((set) => ({
  hideToast: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    set({
      isVisible: false,
      message: null,
      tone: 'info',
    });
  },
  isVisible: false,
  message: null,
  showToast: (message, tone = 'info') => {
    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    set({
      isVisible: true,
      message,
      tone,
    });

    hideTimer = setTimeout(() => {
      set({
        isVisible: false,
        message: null,
        tone: 'info',
      });
      hideTimer = null;
    }, 3200);
  },
  tone: 'info',
}));
