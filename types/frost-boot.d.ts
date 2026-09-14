export {};

declare global {
  interface Window {
    __FROST_BOOT__?: {
      canvas?: HTMLCanvasElement;
      filled: boolean;
      cleared: boolean;
      skip: () => void;
    };
  }
}
