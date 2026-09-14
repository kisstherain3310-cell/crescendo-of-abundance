export {};

declare global {
  interface WindowEventMap {
    "frost-skip": Event;
    "frost:cleared": CustomEvent<void>;
    "open-recipe": CustomEvent<{ seed?: number }>;
  }

  interface Window {
    __FROST_BOOT__?: {
      canvas?: HTMLCanvasElement;
      filled: boolean;
      cleared: boolean;
      skip: () => void;
    };
    __TOMATO_BOOT__?: {
      canvas?: HTMLCanvasElement;
      ready: boolean;
      count: number;
      tapAt: (clientX: number, clientY: number) => boolean;
      conceal: () => void;
      reveal: () => void;
    };
  }
}
