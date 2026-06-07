import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

export interface GeneratedContent {
  titles: string[];
  structure: {
    intro: string;
    body: string[];
    conclusion: string;
  };
  script: string;
  catchcopies: string[];
  midjourneyPrompts: string[];
  sunoPrompts: {
    opening: string;
    body: string[];
    ending: string;
  };
  description: string;
}

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function heading2(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
  });
}

function para(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 100 },
  });
}

function numbered(index: number, text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `${index}. ${text}`, size: 22 })],
    spacing: { after: 100 },
  });
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

    heading("📌 動画タイトル案"),
    ...content.titles.map((t, i) => numbered(i + 1, t)),

    heading("📋 動画構成"),
    heading2("導入"),
    para(content.structure.intro),
    heading2("本編"),
    ...content.structure.body.map((b, i) => numbered(i + 1, b)),
    heading2("まとめ"),
    para(content.structure.conclusion),

    heading("📝 本編台本"),
    ...content.script.split("\n").map((line) => para(line || " ")),

    heading("🎨 サムネイルキャッチコピー案"),
    ...content.catchcopies.map((c, i) => numbered(i + 1, c)),

    heading("🖼 Midjourneyプロンプト（サムネイル画像用）"),
    ...content.midjourneyPrompts.map((p, i) => numbered(i + 1, p)),

    heading("🎵 SUNO BGMプロンプト"),
    heading2("オープニング"),
    para(content.sunoPrompts.opening),
    heading2("本編BGM"),
    ...content.sunoPrompts.body.map((b, i) => numbered(i + 1, b)),
    heading2("エンディング"),
    para(content.sunoPrompts.ending),

    heading("📄 YouTube動画説明欄"),
    ...content.description.split("\n").map((line) => para(line || " ")),
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `台本_${theme.slice(0, 30)}.docx`);
}
