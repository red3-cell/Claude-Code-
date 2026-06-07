import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(theme: string, reference: string, transcript: string): string {
  const refSection = reference ? "\n\n[Reference material]\n" + reference : "";
  const transcriptSection = transcript ? "\n\n[Reference transcript]\n" + transcript : "";

  return (
    "You are an expert YouTube script writer for a Japanese business channel.\n" +
    "Target audience: Japanese professionals aged 20-50 who want to start their own business or advance their career.\n\n" +
    "Video theme: " + theme + refSection + transcriptSection + "\n\n" +
    "Output ONLY a valid JSON object (no markdown, no code fences, no explanation).\n" +
    "The JSON must have exactly these fields:\n\n" +
    "{\n" +
    '  "titles": ["title1", "title2", "title3"],\n' +
    '  "structureIntro": "description of intro section",\n' +
    '  "structureBody": ["section1", "section2", "section3", "section4", "section5", "section6"],\n' +
    '  "structureConclusion": "description of conclusion section",\n' +
    '  "script": "FULL Japanese script in conversational style, minimum 10000 characters. Use natural spoken Japanese. Include specific episodes, numbers, examples. Address viewers directly.",\n' +
    '  "catchcopies": ["catchcopy1", "catchcopy2", "catchcopy3"],\n' +
    '  "midjourneyPrompts": [\n' +
    '    "Pattern 1 photorealistic: professional business scene related to the theme, high contrast, space for text, 8k quality --ar 16:9 --v 6",\n' +
    '    "Pattern 2 cinematic: dramatic cinematic shot with strong color grading related to the theme, moody lighting --ar 16:9 --v 6",\n' +
    '    "Pattern 3 minimalist: clean flat design related to the theme, bold colors, simple shapes --ar 16:9 --v 6",\n' +
    '    "Pattern 4 illustrated: vector art illustration related to the theme, vibrant colors, dynamic composition --ar 16:9 --v 6"\n' +
    "  ],\n" +
    '  "sunoPrompts": [\n' +
    '    "OPENING: Genre: corporate pop; Tempo: 128 BPM; Mood: energetic, inspiring; Instruments: piano, synth, drums; Style: YouTube intro, 20-30 seconds",\n' +
    '    "BODY BGM 1: Genre: ambient corporate; Tempo: 90 BPM; Mood: calm, focused; Instruments: soft piano, strings; Style: background for narration, 2-3 min loop",\n' +
    '    "BODY BGM 2: Genre: motivational pop; Tempo: 110 BPM; Mood: uplifting, motivating; Instruments: acoustic guitar, light percussion; Style: inspiring background for key points",\n' +
    '    "BODY BGM 3: Genre: corporate electronic; Tempo: 120 BPM; Mood: dynamic, intense; Instruments: synth bass, electronic drums; Style: energetic for climax section",\n' +
    '    "BODY BGM 4: Genre: smooth jazz; Tempo: 95 BPM; Mood: confident, steady; Instruments: piano, bass, brushed drums; Style: professional feel for practical tips",\n' +
    '    "ENDING: Genre: uplifting orchestral pop; Tempo: 100 BPM; Mood: satisfying, hopeful; Instruments: strings, piano; Style: warm outro, fade out 30-60 seconds"\n' +
    "  ],\n" +
    '  "youtubeDescription": "3-5 lines Japanese description with SEO keywords naturally included, brief summary of video content, end with a line encouraging channel subscription, include 3-5 hashtags"\n' +
    "}\n\n" +
    "IMPORTANT:\n" +
    "- script must be at least 10000 Japanese characters\n" +
    "- midjourneyPrompts must be exactly 4 items in English, replace the placeholder descriptions with actual content related to '" + theme + "'\n" +
    "- sunoPrompts must be exactly 6 items in English\n" +
    "- youtubeDescription must be in Japanese\n" +
    "- Output ONLY the JSON object, nothing else"
  );
}

export async function POST(req: NextRequest) {
  const { theme, reference, transcript } = await req.json();

  if (!theme) {
    return NextResponse.json({ error: "テーマを入力してください" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 20000,
    messages: [{ role: "user", content: buildPrompt(theme, reference ?? "", transcript ?? "") }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
  }

  let jsonText = content.text.trim();
  // Strip markdown code fences if present
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error("JSON parse error:", e);
    console.error("Raw text (first 500 chars):", jsonText.slice(0, 500));
    return NextResponse.json({ error: "JSONの解析に失敗しました。再度お試しください。" }, { status: 500 });
  }

  return NextResponse.json({
    titles: Array.isArray(parsed.titles) ? parsed.titles : [],
    structureIntro: typeof parsed.structureIntro === "string" ? parsed.structureIntro : "",
    structureBody: Array.isArray(parsed.structureBody) ? parsed.structureBody : [],
    structureConclusion: typeof parsed.structureConclusion === "string" ? parsed.structureConclusion : "",
    script: typeof parsed.script === "string" ? parsed.script : "",
    catchcopies: Array.isArray(parsed.catchcopies) ? parsed.catchcopies : [],
    midjourneyPrompts: Array.isArray(parsed.midjourneyPrompts) ? parsed.midjourneyPrompts : [],
    sunoPrompts: Array.isArray(parsed.sunoPrompts) ? parsed.sunoPrompts : [],
    youtubeDescription: typeof parsed.youtubeDescription === "string" ? parsed.youtubeDescription : "",
  });
}
