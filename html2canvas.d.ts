declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
    allowTaint?: boolean;
    removeContainer?: boolean;
    imageTimeout?: number;
    scrollX?: number;
    scrollY?: number;
    fontEmbedCSS?: boolean;
    ignoreElements?: (element: HTMLElement) => boolean;
    onclone?: (clonedDoc: Document, element: HTMLElement) => void;
    [key: string]: any; // Allow additional options
  }

  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>;

  export default html2canvas;
}
