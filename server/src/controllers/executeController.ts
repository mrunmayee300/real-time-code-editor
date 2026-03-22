import type { Request, Response } from "express";

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";

export async function executeCode(req: Request, res: Response) {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      res.status(500).json({ error: "missing_api_key" });
      return;
    }
    const { source_code, language_id, language } = req.body as {
      source_code?: string;
      language_id?: number;
      language?: string;
    };
    if (typeof source_code !== "string") {
      res.status(400).json({ error: "invalid_body" });
      return;
    }
    const lid =
      typeof language_id === "number"
        ? language_id
        : language === "python"
          ? 71
          : 63;

    const r = await fetch(
      `${JUDGE0_URL}/submissions?wait=true&base64_encoded=false`,
      {
        method: "POST",
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": JUDGE0_HOST,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source_code, language_id: lid }),
      }
    );
    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "judge0_failed", detail });
      return;
    }
    const d = (await r.json()) as {
      stdout?: string | null;
      stderr?: string | null;
      compile_output?: string | null;
    };
    const parts = [
      d.compile_output && `[compile]\n${d.compile_output}`,
      d.stdout && `[stdout]\n${d.stdout}`,
      d.stderr && `[stderr]\n${d.stderr}`,
    ].filter(Boolean);
    res.json({ output: parts.join("\n\n") || "(no output)" });
  } catch {
    res.status(500).json({ error: "execute_failed" });
  }
}
