import mammoth from "mammoth"

export async function parseDocument(file: Buffer, type: string) {

  if (type === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule: any = await import("pdf-parse")
    let pdfParse = pdfModule.default || pdfModule

    // Some module wrappers export function as 'parse' property.
    if (typeof pdfParse !== "function" && typeof pdfModule.parse === "function") {
      pdfParse = pdfModule.parse
    }

    if (typeof pdfParse !== "function") {
      throw new Error("pdf-parse module did not expose a callable parser")
    }

    const data = await pdfParse(file)
    return data.text
  }

  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file })
    return result.value
  }

  if (type === "application/msword") {
    // For older .doc files, we'll try to extract text using mammoth as well
    // Note: mammoth has limited support for .doc files, but it's better than nothing
    try {
      const result = await mammoth.extractRawText({ buffer: file })
      return result.value
    } catch {
      throw new Error("Unable to parse .doc file. Please convert to .docx format.")
    }
  }

  if (type === "text/plain" || type === "text/csv") {
    // For plain text and CSV files, just convert buffer to string
    return file.toString('utf-8')
  }

  if (type.startsWith("image/")) {
    // For images, we can't extract text directly, but we'll provide a helpful message
    return `[Image file: ${type}] - Image files are accepted but text extraction is not available. Consider using OCR services for text extraction from images.`
  }

  throw new Error("Unsupported file type")
}