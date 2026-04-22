import "server-only"
import "pdf-parse/worker"

import { PDFParse } from "pdf-parse"

export function formatExtractedText(text: string): string {
  if (!text) return ""

  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    await parser.destroy()

    const rawText =
      typeof result?.text === "string"
        ? result.text
        : Array.isArray(result?.pages)
          ? result.pages.map((page) => page.text ?? "").join("\n")
          : ""

    const text = formatExtractedText(rawText)

    if (!text) {
      return "No text content found in the PDF."
    }

    return text
  } catch (error) {
    console.error("PDF Parsing Error:", error)
    return "Error: Could not parse PDF."
  }
}