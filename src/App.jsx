import React, { useState, useEffect } from 'react';
import { Camera, Upload, TrendingUp, TrendingDown, AlertCircle, RefreshCw, CheckCircle, Shield, Zap, Sparkles, HelpCircle, History, Trash2, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// サンプルチャート画像（モック用ベース64画像）
const SAMPLE_CHARTS = [
  {
    id: 'bullish_double_bottom',
    name: '上昇ダブルボトム (USD/JPY)',
    pair: 'USD/JPY',
    timeframe: '1時間足',
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMTgyNyIvPjxwYXRoIGQ9Ik0gNTAgMjAwIEwgMTAwIDEyMCBMIDE1MCAyMjAgTCAyMDAgMTQwIEwgMjUwIDIyMCBMIDMwMCAxMDAgTCAzNTAgMTkwIEwgNDAwIDgwIEwgNDUwIDE1MCBMIDUwMCA3MCBMIDU1MCAxMzAgTCA2MDAgNTAiIHN0cm9rZT0iIzEwYjk4MSIgc3Rvd2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4='
  },
  {
    id: 'bearish_head_shoulders',
    name: '下落ヘッド＆ショルダー (EUR/USD)',
    pair: 'EUR/USD',
    timeframe: '4時間足',
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMTgyNyIvPjxwYXRoIGQ9Ik0gNTAgMTUwIEwgMTAwIDkwIEwgMTUwIDE2MCBMIDIwMCA1MCBMIDI1MCAxNjAgTCAzMDAgMTAwIEwgMzUwIDE2MCBMIDQwMCAyMjAgTCA0NTAgMTgwIEwgNTAwIDI0MCBMIDU1MCAyMDAgTCA2MDAgMjgwIiBzdHJva2U9IiNmNDNmNWIiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=='
  }
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currencyPair, setCurrencyPair] = useState('USD/JPY');
  const [timeframe, setTimeframe] = useState('1時間足');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // ローカルストレージから履歴を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('fx_chart_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 履歴を保存
  const saveToHistory = (result, pair, tf, img) => {
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      pair,
      timeframe: tf,
      image: img,
      result
    };
    const updated = [newItem, ...history.slice(0, 19)];
    setHistory(updated);
    localStorage.setItem('fx_chart_history', JSON.stringify(updated));
  };

  // 画像ファイル選択時の処理
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // サンプル選択時の処理
  const selectSample = (sample) => {
    setImagePreview(sample.image);
    setCurrencyPair(sample.pair);
    setTimeframe(sample.timeframe);
    setSelectedImage(sample.image);
  };

  // Gemini APIによるチャート画像分析の実行
  const analyzeChart = async () => {
    if (!imagePreview) {
      setError('チャート画像を選択またはアップロードしてください。');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。Vercelの環境変数（VITE_GEMINI_API_KEY）を確認してください。');
      }

      const ai = new GoogleGenAI({ apiKey });

      let base64Data = imagePreview;
      let mimeType = 'image/png';
      if (imagePreview.startsWith('data:image')) {
        const matches = imagePreview.match(/^data:(.+?);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const prompt = `
あなたはプロのFXテクニカルアナリストおよびシストレ開発者です。
添付されたFXのチャート画像（通貨ペア: ${currencyPair}, 時間足: ${timeframe}）を詳細に分析し、以下のJSON形式のみで正確に回答してください。マークダウンのバッククォート（\`\`\`json ... \`\`\`）は含めず、純粋なJSON文字列のみを出力してください。

{
  "signal": "買い(Bullish)" または "売り(Bearish)" または "様子見(Neutral)",
  "confidence": 75,
  "summary": "チャートの状況についての簡潔な要約（50文字程度）",
  "technicalReason": "ローソク足の形状、トレンドライン、インジケーター等に基づく詳細な根拠",
  "entryPrice": "推奨エントリー価格帯（例: 152.350付近）",
  "takeProfit": "利確目標価格（例: 153.100）",
  "stopLoss": "損切ライン（例: 151.900）",
  "riskRewardRatio": "リスクリワード比率（例: 1:2.0）",
  "advice": "トレード時の注意点やリスク管理のアドバイス"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      });

      let textResponse = response.text.trim();
      textResponse = textResponse.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

      const parsedResult = JSON.parse(textResponse);
      setAnalysisResult(parsedResult);
      saveToHistory(parsedResult, currencyPair, timeframe, imagePreview);

    } catch (err) {
      console.error(err);
      setError('分析中にエラーが発生しました: ' + (err.message || '不明なエラー'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* ヘッダー */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              FX Chart AI Analyzer
            </h1>
          </div>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-emerald-400 border border-slate-700 font-medium">
            Gemini Powered
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* 通貨ペア・時間足設定 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 backdrop-blur">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> 分析条件の設定
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">通貨ペア</label>
              <select 
                value={currencyPair} 
                onChange={(e) => setCurrencyPair(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="USD/JPY">USD/JPY (ドル円)</option>
                <option value="EUR/USD">EUR/USD (ユーロドル)</option>
                <option value="GBP/USD">GBP/USD (ポンドドル)</option>
                <option value="AUD/JPY">AUD/JPY (豪ドル円)</option>
                <option value="EUR/JPY">EUR/JPY (ユーロ円)</option>
                <option value="BTC/USD">BTC/USD (ビットコイン)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">時間足</label>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="1分足">1分足 (M1)</option>
                <option value="5分足">5分足 (M5)</option>
                <option value="15分足">15分足 (M15)</option>
                <option value="1時間足">1時間足 (H1)</option>
                <option value="4時間足">4時間足 (H4)</option>
                <option value="日足">日足 (D1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 画像アップロード & サンプル */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 backdrop-blur">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-cyan-400" /> チャート画像
          </h2>
          
          <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 transition rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 group">
            {imagePreview ? (
              <div className="relative w-full">
                <img src={imagePreview} alt="Chart preview" className="w-full h-48 object-contain rounded-lg bg-slate-950" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                  <span className="text-xs font-semibold bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700 text-slate-200">画像を変更する</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 py-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-emerald-400 group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-300">タップしてチャート画像を選択</div>
                <div className="text-xs text-slate-500">スクショや写真をアップロード</div>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>

          <div className="space-y-1.5 pt-1">
            <div className="text-xs text-slate-400 font-medium">またはサンプルで試す：</div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_CHARTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => selectSample(sample)}
                  className="text-left text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 p-2.5 rounded-xl transition flex items-center justify-between"
                >
                  <span className="truncate font-medium text-slate-300">{sample.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 分析実行ボタン */}
        <button
          onClick={analyzeChart}
          disabled={loading || !imagePreview}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition ${
            loading || !imagePreview
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:opacity-95 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              AIがチャートを解析中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              チャートをAI分析する
            </>
          )}
        </button>

        {/* エラー表示 */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-800/80 text-rose-200 p-4 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* 分析結果表示 */}
        {analysisResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {analysisResult.signal.includes('買い') ? (
                  <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl flex items-center gap-1.5 font-bold text-sm">
                    <TrendingUp className="w-5 h-5" /> 買いシグナル (Bullish)
                  </div>
                ) : analysisResult.signal.includes('売り') ? (
                  <div className="bg-rose-500/20 text-rose-400 p-2 rounded-xl flex items-center gap-1.5 font-bold text-sm">
                    <TrendingDown className="w-5 h-5" /> 売りシグナル (Bearish)
                  </div>
                ) : (
                  <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl flex items-center gap-1.5 font-bold text-sm">
                    <Shield className="w-5 h-5" /> 様子見 (Neutral)
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">確信度</span>
                <span className="text-lg font-extrabold text-cyan-400">{analysisResult.confidence}%</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-400 font-semibold mb-1">相場状況サバイバル</div>
              <p className="text-sm text-slate-200 leading-relaxed">{analysisResult.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">エントリー目安</span>
                <span className="text-sm font-bold text-slate-100">{analysisResult.entryPrice}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">リスクリワード</span>
                <span className="text-sm font-bold text-cyan-400">{analysisResult.riskRewardRatio}</span>
              </div>
              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">
                <span className="text-xs text-emerald-400/80 block mb-1">利確目標 (TP)</span>
                <span className="text-sm font-bold text-emerald-400">{analysisResult.takeProfit}</span>
              </div>
              <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
                <span className="text-xs text-rose-400/80 block mb-1">損切ライン (SL)</span>
                <span className="text-sm font-bold text-rose-400">{analysisResult.stopLoss}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">テクニカル根拠</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                {analysisResult.technicalReason}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">トレード注意点</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                {analysisResult.advice}
              </p>
            </div>

            <div className="text-[10px] text-slate-500 leading-normal pt-2 border-t border-slate-800">
              ※本ツールはAIによる画像認識・分析結果の提示であり、投資助言や利益を保証するものではありません。トレードの最終判断はご自身の責任で行ってください。
            </div>
          </div>
        )}

        {/* 過去の分析履歴 */}
        {history.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> 最近の分析履歴
              </h3>
              <button 
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('fx_chart_history');
                }}
                className="text-xs text-slate-500 hover:text-rose-400 transition"
              >
                履歴をクリア
              </button>
            </div>
            <div className="space-y-2">
              {history.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setAnalysisResult(item.result);
                    setImagePreview(item.image);
                    setCurrencyPair(item.pair);
                    setTimeframe(item.timeframe);
                  }}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt="thumb" className="w-10 h-10 object-cover rounded-lg bg-slate-950" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.pair} ({item.timeframe})</div>
                      <div className="text-[10px] text-slate-400">{item.date}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    item.result.signal.includes('買い') ? 'bg-emerald-500/20 text-emerald-400' :
                    item.result.signal.includes('売り') ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.result.signal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
