// @ts-ignore
import { extractText } from "pdf-ts";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const text = await extractText(buffer);
    
    if (!text || text.trim().length === 0) {
      return "No text content found in the PDF.";
    }

    return text;
  } catch (error) {
    console.error("PDF Parsing Error (pdf-ts):", error);   
    return "Error: Could not parse PDF content using pdf-ts library.";
  }
}