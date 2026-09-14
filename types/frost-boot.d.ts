export {};

declare global {
  interface WindowEventMap {
    "frost-skip": Event;
    "frost:cleared": CustomEvent<void>;
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
