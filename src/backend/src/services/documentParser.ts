import mammoth from 'mammoth';

/**
 * Estrae il testo grezzo da un documento caricato (brief creativo), qualunque
 * sia il formato: PDF, Word (.docx) o testo semplice (.txt/.md).
 * Nessuna chiamata esterna: tutto avviene lato server, in memoria.
 */
export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    // Import dinamico: pdf-parse esegue codice di inizializzazione all'import
    // che tenta di leggere un file di test se importato staticamente in alcuni bundler.
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  // Fallback: tratta tutto il resto (.txt, .md, o mimetype sconosciuto) come testo semplice.
  return buffer.toString('utf-8');
}
