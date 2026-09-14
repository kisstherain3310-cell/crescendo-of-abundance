export {};

declare global {
  interface WindowEventMap {
    "frost-skip": Event;
  }

  interface Window {
    __FROST_BOOT__?: {
      canvas?: HTMLCanvasElement;
      filled: boolean;
      cleared: boolean;
      skip: () => void;
    };
  }
}
