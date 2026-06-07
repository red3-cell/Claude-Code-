import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export interface GeneratedContent {
  titles: string[];
  structureIntro: string;
  structureBody: string[];
  structureConclusion: string;
  script: string;
  catchcopies: string[];
  midjourneyPrompts: string[];
  sunoPrompts: string[];
  youtubeDescription: string;
}

function h1(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
}
function p(text: string) {
  return new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 100 } });
}
function li(i: number, text: string) {
  return new Paragraph({ children: [new TextRun({ text: `${i}. ${text}`, size: 22 })], spacing: { after: 100 } });
}

export async function downloadWord(content: GeneratedContent, theme: string) {
  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "YouTube動画台本", bold: true, size: 40 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `テーマ: ${theme}`, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    h1("📌 動画タイトル案"),
    ...content.titles.map((t, i) => li(i + 1, t)),
    h1("📋 動画構成"),
    h2("導入"), p(content.structureIntro),
    h2("本編"), ...content.structureBody.map((b, i) => li(i + 1, b)),
    h2("まとめ"), p(content.structureConclusion),
    h1("📝 本編台本"),
    ...content.script.split("\n").map((line) => p(line || " ")),
    h1("🎨 サムネイルキャッチコピー案"),
    ...content.catchcopies.map((c, i) => li(i + 1, c)),
    h1("🖼 Midjourneyプロンプト"),
    ...content.midjourneyPrompts.map((mp, i) => li(i + 1, mp)),
    h1("🎵 SUNO BGMプロンプト"),
    ...content.sunoPrompts.map((sp, i) => li(i + 1, sp)),
    h1("📄 YouTube動画説明欄"),
    ...content.youtubeDescription.split("\n").map((line) => p(line || " ")),
  ];

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `台本_${theme.slice(0, 30)}.docx`);
}
