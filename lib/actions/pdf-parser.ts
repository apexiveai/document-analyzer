// @ts-ignore
import { extractText } from "pdf-ts";

/**
 * PDF Buffer ကို လက်ခံပြီး စာသားထုတ်ပေးသည်။
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // pdf-ts ကို သုံးပြီး buffer ထဲက စာသားကို ထုတ်ယူမယ်
    const text = await extractText(buffer);
    
    if (!text || text.trim().length === 0) {
      return "No text content found in the PDF.";
    }

    return text;
  } catch (error) {
    console.error("PDF Parsing Error (pdf-ts):", error);
    // Error တက်ရင်လည်း AI ဆီကို logic ဆက်သွားနိုင်အောင် error message string တစ်ခု ပြန်ပေးထားမယ်
    return "Error: Could not parse PDF content using pdf-ts library.";
  }
}