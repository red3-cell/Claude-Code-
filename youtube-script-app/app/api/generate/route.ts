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
      "本編セクション1：タイトルと詳細な内容説明（具体的なエピソードや事例を含む）",
      "本編セクション2：タイトルと詳細な内容説明",
      "本編セクション3：タイトルと詳細な内容説明",
      "本編セクション4：タイトルと詳細な内容説明",
      "本編セクション5：タイトルと詳細な内容説明",
      "本編セクション6：タイトルと詳細な内容説明"
    ],
    "conclusion": "まとめ部の説明（要点の整理、行動喚起、次回予告）"
  },
  "script": "ここに20〜30分相当の完全な台本を書いてください。話し言葉で自然な文体で、視聴者に語りかけるようなスタイルにしてください。導入から本編（6セクション）、まとめまで全て含めること。各セクションは具体的なエピソード・数字・事例を交えながら詳しく展開し、必ず10000文字以上の台本にしてください。改行を適切に使い読みやすくしてください。",
  "catchcopies": [
    "サムネイル用キャッチコピー1（短くインパクトのある言葉）",
    "サムネイル用キャッチコピー2（数字や結果を示す言葉）",
    "サムネイル用キャッチコピー3（問いかけや共感を呼ぶ言葉）"
  ],
  "midjourneyPrompts": [
    "Pattern 1 (Photorealistic): [detailed English prompt for a photorealistic business thumbnail, specific scene, lighting, subject pose, text space], photorealistic, 8k, sharp focus, --ar 16:9 --v 6",
    "Pattern 2 (Cinematic): [detailed English prompt for a cinematic dramatic style, strong color grading, wide shot or close-up], cinematic lighting, color graded, dramatic, --ar 16:9 --v 6",
    "Pattern 3 (Minimalist): [detailed English prompt for a minimalist flat design thumbnail, clean background, bold graphic elements, strong typography space], minimalist, flat design, bold colors, clean, --ar 16:9 --v 6",
    "Pattern 4 (Illustrated): [detailed English prompt for an illustrated or graphic novel style, vector-like, high contrast, eye-catching], graphic illustration, vector style, high contrast, vibrant, --ar 16:9 --v 6"
  ],
  "sunoPrompts": {
    "opening": "Genre: [specific genre]; Tempo: [BPM]; Mood: [mood keywords]; Instruments: [instruments]; Style: energetic intro, builds excitement, 20-30 seconds, professional YouTube intro feel, [theme-specific descriptors]",
    "body": [
      "Genre: [genre]; Tempo: [BPM]; Mood: focused, calm, explanatory; Instruments: [soft instruments]; Style: background ambient, non-distracting, suitable for narration, corporate, 2-3 minutes loop",
      "Genre: [genre]; Tempo: [BPM]; Mood: motivating, uplifting, mid-energy; Instruments: [instruments]; Style: slightly more dynamic, business motivation, inspirational, suitable for key points section",
      "Genre: [genre]; Tempo: [BPM]; Mood: intense, engaging, forward-moving; Instruments: [instruments]; Style: energetic background, drives engagement, builds tension, suitable for climax section",
      "Genre: [genre]; Tempo: [BPM]; Mood: confident, authoritative, clear; Instruments: [instruments]; Style: steady rhythm, professional feel, suitable for practical tips and action steps"
    ],
    "ending": "Genre: [genre]; Tempo: [BPM]; Mood: satisfying, uplifting, conclusive; Instruments: [instruments]; Style: resolving outro, call-to-action energy, professional fade out, 30-60 seconds, leaves viewer feeling inspired"
  },
  "description": "YouTube動画説明欄のテキスト（3〜5行）。視聴者が検索しやすいキーワードを自然に含め、動画の内容を簡潔に説明し、末尾にチャンネル登録を促す一文を入れること。ハッシュタグも3〜5個含めること。"
}
\`\`\`

重要：
- scriptは必ず10000文字以上の詳細な台本にすること。各セクションを具体的なエピソード・実例・数字で詳しく展開すること
- 話し言葉で、視聴者に直接語りかけるスタイル（「〜ですよね」「〜してみてください」など）
- 専門用語は分かりやすく説明し、初心者でも理解できるように
- Midjourneyプロンプトは全て英語で、スタイル・構図・雰囲気が4パターンで異なること
- SUNOプロンプトは全て英語で、ジャンル・テンポ・ムード・楽器を明記すること
- 本編BGMは4パターンで、それぞれテンションや雰囲気が異なること
- descriptionは日本語で、自然な文章として書くこと
- JSONのみを返し、前後に説明文を加えないこと`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 20000,
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
