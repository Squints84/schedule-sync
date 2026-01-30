import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { image } = await req.json(); // We expect a Base64 string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Use the fast/cheap model (gemini-3-flash requires -preview suffix; gemini-2.5-flash is stable)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // IMPORTANT: We give the AI the current date so it knows which "Monday" to pick.
    const today = new Date().toISOString();

    const prompt = `
      You are an API that extracts work shifts from schedule images for Alexander Diaz. Every other worker should be ignored.
      Today is ${today}.
      
      Analyze the attached image of a work schedule.
      1. Identify the shifts.
      2. If the schedule lacks a year/month, assume it refers to the upcoming dates closest to Today.
      3. Return ONLY a valid JSON array of objects. Do not wrap in markdown code blocks.
      
      Format:
      [
        {
          "summary": "Work",
          "start": "YYYY-MM-DDTHH:MM:00", 
          "end": "YYYY-MM-DDTHH:MM:00"
        }
      ]
      
      Notes:
      - "start" and "end" must be valid ISO 8601 strings.
      - Convert 12h times (e.g. 2pm) to 24h ISO format.
      - If an end time is past midnight (e.g. 2pm to 2am), increment the day for the end date.
    `;

    // Strip the data:image/jpeg;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Clean up if the AI accidentally adds markdown backticks
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const shifts = JSON.parse(cleanedText);

    return NextResponse.json({ shifts });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to parse schedule" }, { status: 500 });
  }
}