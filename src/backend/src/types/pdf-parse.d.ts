/**
 * pdf-parse non fornisce tipi propri (ne' @types/pdf-parse esiste su npm).
 * Dichiarazione minimale per il solo utilizzo che ne facciamo in documentParser.ts.
 */
declare module 'pdf-parse' {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>;

  export default pdfParse;
}
