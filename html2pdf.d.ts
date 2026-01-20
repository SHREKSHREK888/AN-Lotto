declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
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
      [key: string]: any; // Allow additional html2canvas options
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: string;
    };
    pagebreak?: {
      mode?: string[];
    };
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
  }

  function html2pdf(): Html2Pdf;

  export default html2pdf;
}
