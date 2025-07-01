import { Request, Response } from "express";
import db from "../../../utils/db/db.js";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function cleanGeminiResponse(text: string): string {
  let cleaned = text.replace(/```(json)?/g, "").replace(/```/g, "");

  cleaned = cleaned
    .split("\n")
    .map((line) => line.replace(/^\[\d+\]\s*/, ""))
    .join("\n");

  return cleaned.trim();
}

function extractJSON(text: string): string | null {
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;

  let openBraces = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces--;

      if (openBraces === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  return null;
}

const generateBoard = async (req: Request, res: Response) => {
  const { sprintId } = req.params;
  const { prompt: userPrompt } = req.body;

  try {
    const sprint = await db.sprint.findUnique({
      where: { id: sprintId },
      include: { project: true },
    });

    if (!sprint) {
      return res.status(404).json({ error: "Sprint not found" });
    }

    const fullPrompt = `
You are a software project assistant. A user has asked you to generate a sprint board.

User's Prompt:
"${userPrompt}"

Return a JSON object like this:
{
  "columns": ["Backlog", "In Progress", "Review", "Done"],
  "tasks": [
    {
      "name": "Create login UI",
      "content": "Design the login screen with validation",
      "column": "Backlog"
    },
    {
      "name": "Build authentication API",
      "content": "Implement signup and login API endpoints",
      "column": "In Progress"
    }
  ]
}
Only return valid JSON. No extra text.
    `;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const rawText = response?.text ?? "";

    if (!rawText) {
      return res.status(500).json({ error: "No text received from Gemini API" });
    }

    console.log("Full Gemini response text:", rawText);

    const cleanedText = cleanGeminiResponse(rawText);
    console.log("Cleaned Gemini response text:", cleanedText);

    const jsonStr = extractJSON(cleanedText);
    if (!jsonStr) {
      return res.status(500).json({ error: "Failed to extract JSON from Gemini API response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      console.error("JSON string was:", jsonStr);
      return res.status(500).json({ error: "Failed to parse JSON from Gemini API response" });
    }

    const createdColumns = await Promise.all(
      parsed.columns.map((colName: string) =>
        db.column.create({
          data: {
            name: colName,
            sprintId: sprint.id,
          },
        })
      )
    );

    const columnMap = createdColumns.reduce((acc: Record<string, string>, col: any) => {
      acc[col.name.toLowerCase()] = col.id;
      return acc;
    }, {});

    let orderTracker: Record<string, number> = {};

    await Promise.all(
      parsed.tasks.map((task: any) => {
        const columnKey = task.column.toLowerCase();
        const columnId = columnMap[columnKey];
        if (!columnId) return;

        const order = (orderTracker[columnId] = (orderTracker[columnId] || 0) + 1);

        return db.task.create({
          data: {
            name: task.name,
            content: task.content || "",
            deadline: sprint.endDate,
            projectId: sprint.projectId,
            columnId,
            order,
          },
        });
      })
    );

    return res.json({ message: "Sprint board generated successfully." });
  } catch (error: any) {
    console.error("Error generating sprint board:", error);
    return res.status(500).json({
      error: "Failed to generate board.",
      details: error.message,
    });
  }
};

export default generateBoard;
