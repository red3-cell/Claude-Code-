"use client";

import { useState } from "react";
import { downloadWord, type GeneratedContent } from "@/lib/generateWord";

function buildAllText(r: GeneratedContent): string {
  return [
    "=== 動画タイトル案 ===",
    r.titles.map((t, i) => `${i + 1}. ${t}`).join("\n"),
    "\n=== 動画構成 ===",
    `[導入]\n${r.structureIntro}`,
    `[本編]\n${r.structureBody.map((b, i) => `${i + 1}. ${b}`).join("\n")}`,
    `[まとめ]\n${r.structureConclusion}`,
    "\n=== 本編台本 ===",
    r.script,
    "\n=== サムネイルキャッチコピー案 ===",
    r.catchcopies.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    "\n=== Midjourneyプロンプト ===",
    r.midjourneyPrompts.map((p, i) => `Pattern ${i + 1}: ${p}`).join("\n"),
    "\n=== SUNO BGMプロンプト ===",
    r.sunoPrompts.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    "\n=== YouTube動画説明欄 ===",
    r.youtubeDescription,
  ].join("\n");
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
  const [copiedMidjourney, setCopiedMidjourney] = useState(false);
  const [copiedSuno, setCopiedSuno] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

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
      setResult(data as GeneratedContent);
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

  async function handleCopyMidjourney() {
    if (!result) return;
    await navigator.clipboard.writeText(result.midjourneyPrompts.map((p, i) => `Pattern ${i + 1}: ${p}`).join("\n\n"));
    setCopiedMidjourney(true);
    setTimeout(() => setCopiedMidjourney(false), 2000);
  }

  async function handleCopySuno() {
    if (!result) return;
    await navigator.clipboard.writeText(result.sunoPrompts.join("\n\n"));
    setCopiedSuno(true);
    setTimeout(() => setCopiedSuno(false), 2000);
  }

  async function handleCopyDesc() {
    if (!result) return;
    await navigator.clipboard.writeText(result.youtubeDescription);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">🎬 YouTube台本自動生成</h1>
        <p className="text-sm text-gray-500 mt-1">ビジネス系YouTubeチャンネル向け・20〜30分動画対応</p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Input form */}
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">参考URL・記事本文（任意）</label>
            <textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="参考にしたい記事の本文やURLを貼り付けてください"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">参考動画の文字起こし（任意）</label>
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

        {/* Loading spinner */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 text-sm">AIが台本を生成しています。しばらくお待ちください...</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={handleCopyScript}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {copiedScript ? "✅ コピーしました" : "📋 台本をコピー"}
              </button>
              <button
                onClick={handleCopyAll}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {copiedAll ? "✅ コピーしました" : "📋 全文一括コピー"}
              </button>
              <button
                onClick={() => downloadWord(result, theme)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ⬇️ Wordでダウンロード
              </button>
            </div>

            {/* 1. Titles */}
            <Card title="📌 動画タイトル案">
              <ol className="list-decimal list-inside space-y-2">
                {result.titles.map((t, i) => <li key={i} className="text-gray-800 font-medium">{t}</li>)}
              </ol>
            </Card>

            {/* 2. Structure */}
            <Card title="📋 動画構成">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-blue-700 mb-1">導入</p>
                  <p className="text-sm text-gray-700">{result.structureIntro}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-700 mb-1">本編</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {result.structureBody.map((b, i) => <li key={i} className="text-sm text-gray-700">{b}</li>)}
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-700 mb-1">まとめ</p>
                  <p className="text-sm text-gray-700">{result.structureConclusion}</p>
                </div>
              </div>
            </Card>

            {/* 3. Script */}
            <Card
              title="📝 本編台本"
              action={
                <button onClick={handleCopyScript} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1 rounded-lg transition-colors">
                  {copiedScript ? "✅ コピー済み" : "📋 台本をコピー"}
                </button>
              }
            >
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans max-h-[600px] overflow-y-auto">
                {result.script}
              </pre>
            </Card>

            {/* 4. Catchcopies */}
            <Card title="🎨 サムネイルキャッチコピー案">
              <ol className="list-decimal list-inside space-y-2">
                {result.catchcopies.map((c, i) => <li key={i} className="text-gray-800 font-medium">{c}</li>)}
              </ol>
            </Card>

            {/* 5. Midjourney */}
            <Card
              title="🖼 Midjourneyプロンプト（英語・4パターン）"
              action={
                <button onClick={handleCopyMidjourney} className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium px-3 py-1 rounded-lg transition-colors">
                  {copiedMidjourney ? "✅ コピー済み" : "📋 全プロンプトをコピー"}
                </button>
              }
            >
              <div className="space-y-3">
                {result.midjourneyPrompts.map((p, i) => (
                  <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <span className="text-xs font-bold text-purple-700 block mb-1">Pattern {i + 1}</span>
                    <p className="text-sm text-gray-800 font-mono break-all">{p}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 6. SUNO */}
            <Card
              title="🎵 SUNO BGMプロンプト（英語・6パターン）"
              action={
                <button onClick={handleCopySuno} className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium px-3 py-1 rounded-lg transition-colors">
                  {copiedSuno ? "✅ コピー済み" : "📋 全プロンプトをコピー"}
                </button>
              }
            >
              <div className="space-y-3">
                {result.sunoPrompts.map((s, i) => (
                  <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <span className="text-xs font-bold text-orange-700 block mb-1">
                      {i === 0 ? "Opening（オープニング）" : i === result.sunoPrompts.length - 1 ? "Ending（エンディング）" : `Body BGM ${i}（本編BGM ${i}）`}
                    </span>
                    <p className="text-sm text-gray-800 font-mono break-all">{s}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 7. YouTube description */}
            <Card
              title="📄 YouTube動画説明欄"
              action={
                <button onClick={handleCopyDesc} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1 rounded-lg transition-colors">
                  {copiedDesc ? "✅ コピー済み" : "📋 コピー"}
                </button>
              }
            >
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                {result.youtubeDescription}
              </pre>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
