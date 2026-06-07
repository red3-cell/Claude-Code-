import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { theme, reference, transcript } = await req.json();

  if (!theme) {
    return NextResponse.json({ error: "テーマを入力してください" }, { status: 400 });
  }

  const prompt = `あなたはYouTubeチャンネル向けの動画台本を作成する専門家です。
ターゲット視聴者は20代〜50代のビジネスパーソンで、独立・起業志望、または社内昇進を目指している向上心が高い人たちです。

以下の情報をもとに、20〜30分の動画台本を作成してください。

【動画テーマ・タイトル案】
${theme}

${reference ? `【参考資料・記事本文】\n${reference}\n` : ""}
${transcript ? `【参考動画の文字起こし】\n${transcript}\n` : ""}

以下のJSON形式で出力してください。各フィールドの説明の通りに記入してください：

\`\`\`json
{
  "titles": [
    "タイトル案1（クリック率が高いキャッチーなタイトル）",
    "タイトル案2（数字や具体性を含むタイトル）",
    "タイトル案3（視聴者の悩みに刺さるタイトル）"
  ],
  "structure": {
    "intro": "導入部の説明（視聴者を引き込む導入、問題提起、動画で得られる価値の提示）",
    "body": [
      "本編セクション1のタイトルと内容説明",
      "本編セクション2のタイトルと内容説明",
      "本編セクション3のタイトルと内容説明",
      "本編セクション4のタイトルと内容説明",
      "本編セクション5のタイトルと内容説明"
    ],
    "conclusion": "まとめ部の説明（要点の整理、行動喚起、次回予告）"
  },
  "script": "ここに20〜30分相当の完全な台本を書いてください。話し言葉で自然な文体で、視聴者に語りかけるようなスタイルにしてください。導入から本編、まとめまで全て含めること。十分な長さ（8000文字以上）で詳細に書いてください。",
  "catchcopies": [
    "サムネイル用キャッチコピー1（短くインパクトのある言葉）",
    "サムネイル用キャッチコピー2（数字や結果を示す言葉）",
    "サムネイル用キャッチコピー3（問いかけや共感を呼ぶ言葉）"
  ],
  "midjourneyPrompts": [
    "Midjourney prompt 1: Professional business thumbnail image, [specific visual concept related to the theme], high contrast, bold text space on left, corporate setting, 8k quality, --ar 16:9",
    "Midjourney prompt 2: [Different visual approach], modern office background, successful businessman, dynamic composition, vibrant colors, photorealistic, --ar 16:9",
    "Midjourney prompt 3: [Creative concept], minimalist design, strong visual metaphor for the theme, premium feel, --ar 16:9"
  ],
  "sunoPrompts": {
    "opening": "SUNO BGM prompt for opening (15-30 seconds): uplifting corporate intro music, [mood related to theme], professional, energetic start, builds excitement",
    "body": [
      "SUNO BGM prompt for body section 1: background music for explanation segment, subtle, non-distracting, corporate ambient, focus-enhancing",
      "SUNO BGM prompt for body section 2: slightly more dynamic background, mid-energy, business motivation, instrumental",
      "SUNO BGM prompt for body section 3: engaging background for key points section, inspirational corporate, subtle beat"
    ],
    "ending": "SUNO BGM prompt for ending (30-60 seconds): satisfying conclusion music, uplifting resolution, call-to-action energy, fade out professionally"
  }
}
\`\`\`

重要：
- scriptは必ず8000文字以上の詳細な台本にすること
- 話し言葉で、視聴者に直接語りかけるスタイルで書くこと
- 専門用語は分かりやすく説明すること
- 具体例や数字を多用してリアリティを出すこと
- JSONのみを返し、前後に説明文を加えないこと`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
    }

    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) ||
                      content.text.match(/```\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : content.text;

    const result = JSON.parse(jsonText);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "生成中にエラーが発生しました" }, { status: 500 });
  }
}
