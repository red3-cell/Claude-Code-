"use client";

import { useState } from "react";
import { downloadWord, type GeneratedContent } from "@/lib/generateWord";

function buildAllText(result: GeneratedContent): string {
  const lines: string[] = [];

  lines.push("=== 動画タイトル案 ===");
  result.titles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));

  lines.push("\n=== 動画構成 ===");
  lines.push("[導入]");
  lines.push(result.structure.intro);
  lines.push("[本編]");
  result.structure.body.forEach((b, i) => lines.push(`${i + 1}. ${b}`));
  lines.push("[まとめ]");
  lines.push(result.structure.conclusion);

  lines.push("\n=== 本編台本 ===");
  lines.push(result.script);

  lines.push("\n=== サムネイルキャッチコピー案 ===");
  result.catchcopies.forEach((c, i) => lines.push(`${i + 1}. ${c}`));

  lines.push("\n=== Midjourneyプロンプト ===");
  result.midjourneyPrompts.forEach((p, i) => lines.push(`Pattern ${i + 1}: ${p}`));

  lines.push("\n=== SUNO BGMプロンプト ===");
  lines.push("[オープニング]");
  lines.push(result.sunoPrompts.opening);
  lines.push("[本編BGM]");
  result.sunoPrompts.body.forEach((b, i) => lines.push(`Body ${i + 1}: ${b}`));
  lines.push("[エンディング]");
  lines.push(result.sunoPrompts.ending);

  lines.push("\n=== YouTube動画説明欄 ===");
  lines.push(result.description);

  return lines.join("\n");
}

export default function Home() {
  const [theme, setTheme] = useState("");
  const [reference, setReference] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, reference, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyScript() {
    if (!result) return;
    await navigator.clipboard.writeText(result.script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }

  async function handleCopyAll() {
    if (!result) return;
    await navigator.clipboard.writeText(buildAllText(result));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  async function handleDownload() {
    if (!result) return;
    await downloadWord(result, theme);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">🎬 YouTube台本自動生成</h1>
        <p className="text-sm text-gray-500 mt-1">ビジネス系YouTubeチャンネル向け・20〜30分動画対応</p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              動画テーマ・タイトル案 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例：副業で月10万円稼ぐ方法、会社員が独立するための5ステップ"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              参考URL・記事本文（任意）
            </label>
            <textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="参考にしたい記事の本文やURLを貼り付けてください"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              参考動画の文字起こし（任意）
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="参考動画の文字起こしテキストを貼り付けてください"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? "生成中...（1〜2分かかります）" : "台本を生成する"}
          </button>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}
        </form>

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 text-sm">AIが台本を生成しています。しばらくお待ちください...</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {copiedScript ? "✅ コピーしました" : "📋 台本をコピー"}
              </button>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {copiedAll ? "✅ コピーしました" : "📋 全文一括コピー"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ⬇️ Wordでダウンロード
              </button>
            </div>

            <Section title="📌 動画タイトル案">
              <ol className="list-decimal list-inside space-y-2">
                {result.titles.map((t, i) => (
                  <li key={i} className="text-gray-800 font-medium">{t}</li>
                ))}
              </ol>
            </Section>

            <Section title="📋 動画構成">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 mb-1">導入</h3>
                  <p className="text-gray-700 text-sm">{result.structure.intro}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 mb-1">本編</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {result.structure.body.map((b, i) => (
                      <li key={i} className="text-gray-700 text-sm">{b}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 mb-1">まとめ</h3>
                  <p className="text-gray-700 text-sm">{result.structure.conclusion}</p>
                </div>
              </div>
            </Section>

            <Section title="📝 本編台本">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans max-h-[600px] overflow-y-auto">
                {result.script}
              </pre>
            </Section>

            <Section title="🎨 サムネイルキャッチコピー案">
              <ol className="list-decimal list-inside space-y-2">
                {result.catchcopies.map((c, i) => (
                  <li key={i} className="text-gray-800 font-medium">{c}</li>
                ))}
              </ol>
            </Section>

            {result.midjourneyPrompts && result.midjourneyPrompts.length > 0 && (
              <Section title="🖼 Midjourneyプロンプト（サムネイル画像用・英語4パターン）">
                <div className="space-y-3">
                  {result.midjourneyPrompts.map((p, i) => (
                    <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <span className="text-xs font-semibold text-purple-600 block mb-1">Pattern {i + 1}</span>
                      <p className="text-sm text-gray-800 font-mono break-all">{p}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {result.sunoPrompts && (
              <Section title="🎵 SUNO BGMプロンプト（英語）">
                <div className="space-y-3">
                  {result.sunoPrompts.opening && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <span className="text-xs font-semibold text-orange-600 block mb-1">Opening（オープニング）</span>
                      <p className="text-sm text-gray-800 font-mono break-all">{result.sunoPrompts.opening}</p>
                    </div>
                  )}
                  {(result.sunoPrompts.body ?? []).map((b, i) => (
                    <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <span className="text-xs font-semibold text-orange-600 block mb-1">Body BGM {i + 1}（本編BGM {i + 1}）</span>
                      <p className="text-sm text-gray-800 font-mono break-all">{b}</p>
                    </div>
                  ))}
                  {result.sunoPrompts.ending && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <span className="text-xs font-semibold text-orange-600 block mb-1">Ending（エンディング）</span>
                      <p className="text-sm text-gray-800 font-mono break-all">{result.sunoPrompts.ending}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {result.description && (
              <Section title="📄 YouTube動画説明欄">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                  {result.description}
                </pre>
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
