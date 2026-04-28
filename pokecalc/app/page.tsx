"use client";

import React, { useState, useMemo } from 'react';
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, Plus, Minus, Layers, Zap, AlertCircle, Copy, BookOpen, LayoutGrid, List, RefreshCcw, Share2, PieChart, ChevronUp, ChevronDown } from 'lucide-react';

const CATEGORY_MAP: Record<string, string> = {
  'ポケモン': 'Pokémon / ポケモン',
  'グッズ': 'Items / グッズ',
  'サポート': 'Supporters / サポート',
  'スタジアム': 'Stadiums / スタジアム',
  'ポケモンのどうぐ': 'Tools / ポケモンのどうぐ',
  'エネルギー': 'Energy / エネルギー',
  'トレーナーズ': 'Trainers / トレーナーズ',
};

const getTypeStyles = (type: string, isSelected: boolean) => {
  const styles: Record<string, string> = {
    'ポケモン': isSelected ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 border-rose-100',
    'グッズ': isSelected ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-600 border-sky-100',
    'サポート': isSelected ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border-amber-100',
    'スタジアム': isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'ポケモンのどうぐ': isSelected ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-600 border-violet-100',
    'エネルギー': isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 border-slate-200',
    'トレーナーズ': isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  return styles[type] || 'bg-slate-100 text-slate-400 border-slate-200';
};

const combinations = (n: number, r: number): number => {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;
  let res = 1;
  for (let i = 1; i <= r; i++) res = res * (n - i + 1) / i;
  return res;
};

const calculateComboProb = (totalDeck: number, drawCount: number, targetCounts: number[]): number => {
  const m = targetCounts.length;
  if (m === 0) return 0;
  let inclusiveSum = 0;
  for (let i = 1; i < (1 << m); i++) {
    let subsetTargetSum = 0, setBits = 0;
    for (let j = 0; j < m; j++) { if ((i >> j) & 1) { subsetTargetSum += targetCounts[j]; setBits++; } }
    const probNone = combinations(totalDeck - subsetTargetSum, drawCount) / combinations(totalDeck, drawCount);
    if (setBits % 2 === 1) inclusiveSum += probNone; else inclusiveSum -= probNone;
  }
  return 1 - inclusiveSum;
};

const calcPrize = (totalDeck: number, targetCounts: number[]): number => {
  const sum = targetCounts.reduce((a, b) => a + b, 0);
  // サイド6枚より対象枚数が多い場合は、物理的に「すべて落ち」はありえないため0%
  if (sum === 0 || totalDeck < 6 || sum > 6) return 0;

  // 「対象のカードがすべてサイドにある」組み合わせ ÷ 「全サイドの組み合わせ」
  return combinations(totalDeck - sum, 6 - sum) / combinations(totalDeck, 6);
};

const parseDeckToRaw = (text: string) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
  const results: any[] = [];
  let currentCategory = 'ポケモン';
  let buffer: string[] = [];

  const containsJapanese = (str: string) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(str);
  const isStrictCategory = (str: string) => /^(ポケモン|グッズ|ポケモンのどうぐ|サポート|スタジアム|エネルギー)(\s*\(\d+\))?$/.test(str);
  const isPtcglHeader = (str: string) => /^(Pokémon|Trainer|Energy|Total Cards):/i.test(str);

  lines.forEach((line) => {
    if (line.includes('デッキコード')) return;

    if (isStrictCategory(line)) {
      currentCategory = line.match(/^(ポケモンのどうぐ|ポケモン|グッズ|サポート|スタジアム|エネルギー)/)![1];
      buffer = [];
      return;
    }
    if (isPtcglHeader(line)) {
      const header = line.match(/^(Pokémon|Trainer|Energy)/i)?.[1].toLowerCase();
      if (header === 'pokémon') currentCategory = 'ポケモン';
      else if (header === 'trainer') currentCategory = 'トレーナーズ';
      else if (header === 'energy') currentCategory = 'エネルギー';
      return;
    }

    const ptcglMatch = line.match(/^(\d+)\s+(.+)$/);
    if (ptcglMatch && !containsJapanese(line) && !line.includes('/') && !isPtcglHeader(line)) {
      const count = parseInt(ptcglMatch[1]);
      const fullName = ptcglMatch[2].trim();
      const nameOnly = fullName.replace(/\s+[A-Z0-9-]+\s+\d+$/i, "").trim();
      results.push({ name: nameOnly, fullName, count, type: currentCategory });
      return;
    }

    const qtyMatch = line.match(/^(\d+)(枚)?(\s*削除)?$/);
    if (qtyMatch) {
      const count = parseInt(qtyMatch[1]);
      let foundName = "";
      for (let i = buffer.length - 1; i >= 0; i--) {
        const b = buffer[i];
        if (containsJapanese(b) && !isStrictCategory(b) && !b.includes('削除') && !/^\d+$/.test(b) && !/^[A-Z0-9]{2,4}$/.test(b) && !/^\d+\/\d+$/.test(b)) {
          foundName = b;
          break;
        }
      }
      if (foundName) {
        results.push({ name: foundName, fullName: foundName, count, type: currentCategory });
        buffer = [];
        return;
      }
    }

    const nameWithQtyMatch = line.match(/^(.+?)(\d+)(枚)?(\s*削除)?$/);
    if (nameWithQtyMatch && containsJapanese(nameWithQtyMatch[1])) {
      const name = nameWithQtyMatch[1].trim();
      const count = parseInt(nameWithQtyMatch[2]);
      if (!isStrictCategory(name)) {
        results.push({ name, fullName: name, count, type: currentCategory });
        return;
      }
    }
    buffer.push(line);
    if (buffer.length > 5) buffer.shift();
  });
  return results;
};

export default function App() {
  // --- 挿入箇所: App関数の先頭 ---
  const TYPE_COLORS = {
    'ポケモン': '#f43f5e', 'グッズ': '#0ea5e9', 'サポート': '#f59e0b',
    'スタジアム': '#059669', 'ポケモンのどうぐ': '#8b5cf6',
    'エネルギー': '#334155', 'トレーナーズ': '#6366f1',
  };
  const [showChart, setShowChart] = useState(true);

  const [deckText, setDeckText] = useState('');
  const [viewMode, setViewMode] = useState<'merged' | 'split'>('merged');
  const [customCounts, setCustomCounts] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawCount, setDrawCount] = useState(7);
  const [calcMode, setCalcMode] = useState<'any' | 'combo'>('any');
  const [tipIndex, setTipIndex] = useState(0);

  const handleShare = async () => {
    const shareData = {
      title: 'POKECALC',
      text: 'Probability Calc for PTCG / ポケカの確率計算サイト',
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Share failed', err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard! / リンクをコピーしました');
    }
  };

  const tips = [
    {
      title: "The 7-Card Rule / 期待値の壁",
      jp: "最初の7枚で「素引き」したいカードは、デッキに9枚以上入れると期待値が1を超えます（60枚デッキの場合）。",
      en: "To statistically expect to see a card in your opening 7, you need at least 9 copies in your 60-card deck."
    },
    {
      title: "Hand Disruption / 手札干渉の耐性",
      jp: "ジャッジマンなら Draw Count を 4 に、アンフェアスタンプなら 2 に設定。その状況で動ける札が何枚あるか確認しましょう。",
      en: "Set Draw to 4 for Judge or 2 for Unfair Stamp. Check how many 'outs' you have left in those situations."
    },
    {
      title: "Universal Input / リスト表示",
      jp: "公式サイトでは「リスト表示」に切り替えて全選択(Ctrl+A)すると、このツールで解析可能です。画像からはコピーできません。",
      en: "On JP official site, switch to 'List View' before copying (Ctrl+A). This tool parses text, not images."
    },
    {
      title: "Prize Card Risk / サイド落ち",
      jp: "1枚差しのカードがサイドに落ちる確率は約10%。2枚入れると、両方が同時にサイドに落ちる確率は約1%まで激減します。",
      en: "A 1-copy card has a 10% chance of being prized. Two copies reduce the total 'prized' risk to just 1%."
    },
    {
      title: "Turn 1 Strategy / 先攻ドロー",
      jp: "先攻1回目の番のシミュレーションは「8枚」で計算しましょう（手札7枚＋山札から引く1枚）。",
      en: "For a T1 sim, set Draw Count to 8 (7 starting hand + 1 natural draw)."
    },
    {
      title: "First Turn Supporter / 先攻サポート",
      jp: "先攻1回目はサポートを使えません。「サポートを引ける確率」が「動ける確率」と直結しない点に注意。",
      en: "The first player cannot use Supporters. Don't confuse 'drawing a Supporter' with 'having a playable hand' on T1."
    },
    {
      title: "Deck Thinning / 圧縮の価値",
      jp: "山札を5枚圧縮すると、次のドローで特定の1枚を引く確率が約3〜5%上がります。この積み重ねが終盤の勝率を変えます。",
      en: "Thinning 5 cards increases specific top-deck odds by 3-5%. These small gains win games in the long run."
    }
  ];

  const displayDeck = useMemo(() => {
    const raw = parseDeckToRaw(deckText);
    if (viewMode === 'split') {
      return raw.map((c, i) => {
        const id = `split-${i}`;
        return { ...c, id, displayName: c.fullName, isSelected: selectedIds.includes(id) };
      });
    }
    const map = new Map();
    raw.forEach(item => {
      const key = `${item.type}-${item.name}`;
      if (map.has(key)) {
        map.get(key).count += item.count;
      } else {
        map.set(key, { ...item, id: key, displayName: item.name });
      }
    });
    return Array.from(map.values()).map(c => ({ ...c, isSelected: selectedIds.includes(c.id) }));
  }, [deckText, viewMode, selectedIds]);

  const groupedDeck = useMemo(() => {
    const groups: Record<string, any[]> = {};
    displayDeck.forEach(c => {
      const finalCount = customCounts[c.id] ?? c.count;
      if (!groups[c.type]) groups[c.type] = [];
      groups[c.type].push({ ...c, currentCount: finalCount });
    });
    return groups;
  }, [displayDeck, customCounts]);

  const totalCount = useMemo(() => {
    return displayDeck.reduce((acc, curr) => acc + (customCounts[curr.id] ?? curr.count), 0);
  }, [displayDeck, customCounts]);

  const selectedCards = useMemo(() => displayDeck.filter(c => c.isSelected), [displayDeck]);

  const stats = useMemo(() => {
    if (totalCount === 0 || selectedCards.length === 0 || totalCount < drawCount) return null;
    const counts = selectedCards.map(c => customCounts[c.id] ?? c.count);
    if (calcMode === 'any') {
      const sum = counts.reduce((a, b) => a + b, 0);
      return (1 - combinations(totalCount - sum, drawCount) / combinations(totalCount, drawCount)) * 100;
    }
    return calculateComboProb(totalCount, drawCount, counts) * 100;
  }, [selectedCards, totalCount, drawCount, calcMode, customCounts]);

  const turnTable = useMemo(() => {
    if (totalCount === 0 || selectedCards.length === 0) return null;
    const counts = selectedCards.map(c => customCounts[c.id] ?? c.count);
    const rows: { draw: number; prob: number }[] = [];
    for (let d = 1; d <= 10; d++) {
      if (totalCount < d) break;
      let prob: number;
      if (calcMode === 'any') {
        const sum = counts.reduce((a, b) => a + b, 0);
        prob = (1 - combinations(totalCount - sum, d) / combinations(totalCount, d)) * 100;
      } else {
        prob = calculateComboProb(totalCount, d, counts) * 100;
      }
      rows.push({ draw: d, prob });
    }
    return rows;
  }, [selectedCards, totalCount, calcMode, customCounts]);

  const prizeRisk = useMemo(() => {
    if (totalCount === 0 || selectedCards.length === 0) return null;
    const counts = selectedCards.map(c => customCounts[c.id] ?? c.count);
    return calcPrize(totalCount, counts) * 100;
  }, [selectedCards, totalCount, customCounts]);

  // --- 挿入箇所: useMemo(turnTable) の下あたり ---
  const chartData = useMemo(() => {
    // 型定義を持つオブジェクトとして初期化
    const counts: Record<string, number> = {};
    let total = 0;

    displayDeck.forEach(c => {
      // customCounts[c.id] が unknown にならないよう明示的にキャスト/フォールバック
      const count = typeof customCounts[c.id] === 'number' ? customCounts[c.id] : Number(c.count);
      const type = c.type || 'Unknown';

      counts[type] = (counts[type] || 0) + count;
      total += count;
    });

    let currentPercent = 0;
    const segments = Object.entries(counts).map(([type, count]) => {
      const percent = total > 0 ? (count / total) * 100 : 0;
      const start = currentPercent;
      currentPercent += percent;

      return {
        type,
        count,
        percent,
        start,
        end: currentPercent,
        // TYPE_COLORS が external で定義されている想定
        color: TYPE_COLORS[type as keyof typeof TYPE_COLORS] || '#cbd5e1'
      };
    });

    return { segments, total };
  }, [displayDeck, customCounts]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter italic text-slate-900">POKECALC</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Supports JP Web & PTCGL formats. / 公式サイトのリストやPTCGLのエクスポートをそのまま貼り付け可能。</p>
          </div>
          <div className="flex items-stretch gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-3 md:py-2 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm active:scale-95 group"
            >
              <Share2 size={16} className="group-hover:animate-bounce" />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-tighter">Share</span>
            </button>
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
              <div className="px-5 md:px-6 py-2 border-r text-center">
                <span className="text-xl md:text-2xl font-black tabular-nums leading-none">{totalCount}</span><br />
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Deck</span>
              </div>
              <div className="px-5 md:px-6 py-2 text-center">
                <span className="text-xl md:text-2xl font-black text-indigo-600 tabular-nums leading-none">{selectedCards.length}</span><br />
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Selected</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border-none shadow-sm flex gap-3 items-start">
            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Copy size={18} /></div>
            <div>
              <h3 className="text-[11px] font-black uppercase mb-1">How to Copy</h3>
              <p className="text-[12px] text-slate-500 leading-tight">
                <strong>JP:</strong>
                <a href="https://www.pokemon-card.com/deck/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline hover:text-indigo-800 mx-1">公式サイト</a>
                でデッキコード入力<br />→「画像表示」を「リスト表示」に切り替えて全選択(Ctrl+A)<br />
                <strong>EN:</strong> Supports PTCGL Export
              </p>
            </div>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm flex gap-3 items-start">
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg"><Zap size={18} /></div>
            <div>
              <h3 className="text-[11px] font-black uppercase mb-1">ANY+</h3>
              <p className="text-[12px] text-slate-500 leading-tight">Prob. of drawing 1+ / いずれかが1枚以上引ける確率</p>
            </div>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm flex gap-3 items-start">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Layers size={18} /></div>
            <div>
              <h3 className="text-[11px] font-black uppercase mb-1">COMBO</h3>
              <p className="text-[12px] text-slate-500 leading-tight">Prob. of drawing 1+ of EACH / 各1枚以上を同時に引く確率</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Col 1 */}
          <div className="lg:col-span-4 space-y-4">
            <Label className="text-[11px] font-black uppercase tracking-widest flex justify-between px-2 text-slate-400">
              <span>1. Paste Deck List / デッキ登録</span>
              <button onClick={() => { setDeckText(''); setSelectedIds([]); setCustomCounts({}); }} className="text-rose-500 text-[10px] font-black hover:underline">Clear</button>
            </Label>
            <Card className="rounded-[3rem] shadow-2xl overflow-hidden h-[400px] bg-[#0F172A] ring-8 ring-white">
              <Textarea
                className="h-full border-none p-8 font-mono text-[13px] text-indigo-300 bg-transparent resize-none focus-visible:ring-0"
                placeholder={`(Example / 例)
ポケモン (21)
ドラメシヤ
M2a
211/193
4枚
ドロンチ
M2a
...
©Pokémon/Nintendo... ← OK
※サイトのメニューやコピーライト等の余計な文章が混ざっても、自動でカード名と枚数だけを抜き出します
============================
Pokémon: 10
4 Dreepy ASC 247
4 Drakloak ASC 248
...`}
                value={deckText}
                onChange={(e) => setDeckText(e.target.value)}
              />
            </Card>
            {/* --- 挿入箇所: デッキ入力カードのすぐ下 --- */}
            {chartData.total > 0 && (
              <Card className="mt-4 p-5 rounded-[2.5rem] bg-white shadow-lg border-none overflow-hidden">
                <button onClick={() => setShowChart(!showChart)} className="w-full flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deck Composition</span>
                  </div>
                  {showChart ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {showChart && (
                  <div className="mt-5 flex flex-col items-center animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="relative w-40 h-40 mb-5">
                      <div className="w-full h-full rounded-full shadow-inner"
                        style={{ background: `conic-gradient(${chartData.segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})` }}
                      />
                      <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black">{chartData.total}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
                      {chartData.segments.map(s => (
                        <div key={s.type} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-[9px] font-bold text-slate-500 truncate">{s.type}</span>
                          <span className="text-[9px] font-black ml-auto">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Col 2 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">2. Select Targets / 対象を選択</Label>
              <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 scale-90 origin-right">
                <button onClick={() => setViewMode('merged')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black transition-all ${viewMode === 'merged' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                  <List size={10} /> MERGED
                </button>
                <button onClick={() => setViewMode('split')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black transition-all ${viewMode === 'split' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                  <LayoutGrid size={10} /> SPLIT
                </button>
              </div>
            </div>
            <div className="h-[700px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {Object.keys(groupedDeck).length > 0 ? Object.entries(groupedDeck).map(([type, cards]) => (
                <div key={type}>
                  <div className="sticky top-0 z-10 bg-[#F8FAFC]/95 py-2">
                    <div className="text-[10px] font-black uppercase border-b-2 border-slate-900 pb-1 mb-2">
                      {CATEGORY_MAP[type] || type}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {cards.map((card) => (
                      <div key={card.id} className={`flex items-center gap-2 p-1 pr-3 rounded-xl border-2 transition-all bg-white ${card.isSelected ? 'border-indigo-600 shadow-md' : 'border-transparent shadow-sm opacity-80'}`}>
                        <button onClick={() => setSelectedIds(prev => prev.includes(card.id) ? prev.filter(i => i !== card.id) : [...prev, card.id])} className="flex-1 flex items-center gap-3 p-3 text-left overflow-hidden">
                          <div className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center ${card.isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                            {card.isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                          </div>
                          <div className="truncate">
                            <p className={`text-[12px] font-black truncate ${card.isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>{card.displayName}</p>
                            <Badge className={`text-[8px] font-black px-1.5 h-4 border ${getTypeStyles(card.type, card.isSelected)}`}>{card.type}</Badge>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
                          <button onClick={() => setCustomCounts(p => ({ ...p, [card.id]: Math.max(0, (customCounts[card.id] ?? card.count) - 1) }))} className="w-6 h-6 flex items-center justify-center bg-white rounded-md border text-slate-400"><Minus size={10} /></button>
                          <span className="w-5 text-center text-[11px] font-black tabular-nums">{card.currentCount}</span>
                          <button onClick={() => setCustomCounts(p => ({ ...p, [card.id]: (customCounts[card.id] ?? card.count) + 1 }))} className="w-6 h-6 flex items-center justify-center bg-white rounded-md border text-slate-400"><Plus size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] text-slate-300 p-12 text-center bg-white/50">
                  <AlertCircle size={32} className="opacity-10 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic leading-relaxed">Enter deck list / デッキリストを入力</p>
                </div>
              )}
            </div>
          </div>

          {/* Col 3 */}
          <div className="lg:col-span-4 space-y-6">
            <Label className="text-[11px] font-black uppercase tracking-widest px-2 text-slate-400">3. Simulation / 確率計算</Label>
            {stats !== null ? (
              <div className="space-y-4">

                {/* ANY / COMBO 大きな % カード */}
                <Card className="rounded-[4rem] bg-white shadow-2xl p-7 text-center ring-1 ring-slate-100">
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-2 border">
                    <button onClick={() => setCalcMode('any')} className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all ${calcMode === 'any' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>ANY 1+</button>
                    <button onClick={() => setCalcMode('combo')} className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all ${calcMode === 'combo' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>COMBO</button>
                  </div>
                  <div className="text-[90px] font-black leading-none tracking-tighter text-slate-900 mb-4 tabular-nums">
                    {stats.toFixed(1)}<span className="text-3xl text-indigo-300 ml-1">%</span>
                  </div>
                  <div className="pt-4 border-t flex items-center justify-between font-black">
                    <div className="text-left font-black">
                      <p className="text-[12px] leading-none">Draw Count</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase">手札枚数</p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
                      <button onClick={() => setDrawCount(Math.max(1, drawCount - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border"><Minus size={16} /></button>
                      <span className="text-2xl w-6 tabular-nums">{drawCount}</span>
                      <button onClick={() => setDrawCount(Math.min(60, drawCount + 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border"><Plus size={16} /></button>
                    </div>
                  </div>
                </Card>

                {/* サイド落ちリスクバッジ */}
                {prizeRisk !== null && (
                  <div className={`flex items-center justify-between bg-white rounded-3xl px-6 py-4 border-2 transition-all ${prizeRisk >= 10 ? 'border-red-400 bg-red-50 shadow-[0_0_20px_rgba(244,63,94,0.1)]' :
                    prizeRisk >= 0.8 ? 'border-amber-300 bg-amber-50/40' :
                      'border-emerald-300 bg-emerald-50/40'
                    }`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${prizeRisk >= 10 ? 'bg-red-500 animate-pulse' :
                          prizeRisk >= 0.8 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Prize Lock Risk / サイド落ち
                        </p>
                      </div>
                      <p className="text-[13px] font-black text-slate-800">
                        サイド全落ちの<span className={prizeRisk >= 10 ? 'text-red-600' : prizeRisk >= 0.8 ? 'text-amber-600' : 'text-emerald-600'}>確率</span>
                      </p>
                      <div className="mt-1">
                        <p className="text-[8px] font-bold text-slate-400 leading-tight">
                          *Actual risk for Basic Pokémon is slightly lower due to Mulligans.
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 leading-tight">
                          ※たねポケモンの場合、マリガンにより表記よりわずかに低下します。
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className={`text-4xl font-black tabular-nums tracking-tighter ${prizeRisk >= 10 ? 'text-red-600' :
                          prizeRisk >= 0.8 ? 'text-amber-700' :
                            'text-emerald-600'
                          }`}>
                          {prizeRisk.toFixed(prizeRisk < 0.1 ? 2 : 1)}
                        </span>
                        <span className="text-slate-400 text-sm font-black">%</span>
                      </div>

                      <div className={`text-[10px] font-black px-3 py-1 rounded-full inline-block mt-1 uppercase shadow-sm ${prizeRisk >= 10 ? 'bg-red-500 text-white' :
                        prizeRisk >= 0.8 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-500 text-white'
                        }`}>
                        {prizeRisk >= 10 ? 'Critical' :
                          prizeRisk >= 0.8 ? 'Risky' :
                            'SAFE'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ターン別確率テーブル */}
                {turnTable && turnTable.length > 0 && (
                  <div className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Turn-by-turn / ターン別確率
                    </p>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {turnTable.map(({ draw }) => (
                            <th key={draw} style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#94a3b8', fontSize: 10, borderBottom: '0.5px solid #e2e8f0' }}>
                              T{draw}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {turnTable.map(({ draw }) => {
                            // 表示上のT1, T2に対応する「実際のドロー枚数」を計算
                            const actualDraw = draw + 7;

                            // 重要：ここで「actualDraw（8枚〜）」に基づいた正しい確率を計算
                            const counts = selectedCards.map(c => customCounts[c.id] ?? c.count);
                            const correctProb = calcMode === 'any'
                              ? (1 - combinations(totalCount - counts.reduce((a, b) => a + b, 0), actualDraw) / combinations(totalCount, actualDraw)) * 100
                              : calculateComboProb(totalCount, actualDraw, counts) * 100;

                            const isActive = actualDraw === drawCount;
                            const intensity = Math.min(correctProb / 100, 1);

                            return (
                              <td
                                key={draw}
                                onClick={() => setDrawCount(actualDraw)}
                                style={{
                                  padding: '7px 2px',
                                  textAlign: 'center',
                                  background: isActive ? '#4338CA' : `rgba(99,102,241,${(intensity * 0.18).toFixed(2)})`,
                                  color: isActive ? '#fff' : correctProb >= 70 ? '#312e81' : '#64748b',
                                  fontWeight: isActive ? 900 : 600,
                                  fontSize: isActive ? 13 : 11,
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  transition: 'background 0.2s',
                                }}
                                title={`Draw ${actualDraw} cards: ${correctProb.toFixed(1)}%`}
                              >
                                {correctProb.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-[9px] text-slate-300 text-right mt-2 font-black uppercase tracking-widest">
                      T1=8枚, T2=9枚... (列クリックで Draw Count を変更)
                    </p>
                  </div>
                )}

                {/* Simulation Tips */}
                <Card
                  onClick={() => setTipIndex((prev) => (prev + 1) % tips.length)}
                  className="p-5 bg-indigo-900 text-white rounded-[2rem] shadow-xl cursor-pointer hover:bg-indigo-800 transition-all select-none group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Simulation Tip</span>
                    </div>
                    <RefreshCcw size={12} className="text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-tighter">{tips[tipIndex].title}</p>
                    <p className="text-[13px] font-bold leading-tight">{tips[tipIndex].en}</p>
                    <p className="text-[11px] opacity-70 italic leading-snug">{tips[tipIndex].jp}</p>
                  </div>
                  <p className="text-[8px] mt-4 text-center text-indigo-400 font-black tracking-widest uppercase">Click to next tip / クリックで次のチップ</p>
                </Card>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] text-slate-300 p-12 text-center bg-white/50">
                <p className="text-[10px] font-black uppercase tracking-widest italic">Select Cards to Calculate / 計算するカードを選択</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 py-8 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 text-slate-300">
          <div className="h-[1px] w-12 bg-slate-200" />
          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-400">© 2026 POKECALC</p>
          <div className="h-[1px] w-12 bg-slate-200" />
        </div>
        <p className="text-[11px] font-bold text-slate-500">
          Created by <span className="text-indigo-600 font-black tracking-tight">TRON NEKO</span>
        </p>
      </footer>
      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }`}</style>
    </div>
  );
}