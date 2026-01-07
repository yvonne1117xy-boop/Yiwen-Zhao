
import React, { useState, useEffect, useCallback } from 'react';
import { NPC, OutcomeType, MarriageResult, Race, SocialClass } from './types';
import { generateRandomNPC, generateMarriageStory } from './geminiService';
import { COLORS, EYE_COLORS, FACE_SHAPES, EYE_SHAPES, CLASS_HIERARCHY } from './constants';

const NPCDisplay: React.FC<{ npc: NPC; onRefresh?: () => void; isSlot?: boolean }> = ({ npc, onRefresh, isSlot }) => {
  return (
    <div className={`p-6 rounded-xl transition-all duration-300 ${isSlot ? 'bg-slate-800 border-2 border-indigo-500/30' : 'bg-slate-900'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-indigo-300">{npc.identity}</h3>
          <p className="text-sm text-slate-400">世代: {npc.generation} | {npc.race} | {npc.socialClass}</p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">刷新</button>
        )}
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="text-rose-300 font-semibold">外貌 ({npc.appearance.score})</p>
          <div className="ml-2 text-slate-300 leading-relaxed">
            发色：{npc.appearance.hairColor}<br />
            瞳色：{npc.appearance.eyeColor}<br />
            脸型：{npc.appearance.faceShape}<br />
            眼型：{npc.appearance.eyeShape}<br />
            <span className="italic">“{npc.appearance.description}”</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <p><span className="text-amber-400 font-semibold">武力 ({npc.combat.value}):</span> {npc.combat.description}</p>
          <p><span className="text-emerald-400 font-semibold">体质 ({npc.constitution.value}):</span> {npc.constitution.description}</p>
          <p><span className="text-cyan-400 font-semibold">智慧 ({npc.intelligence.value}):</span> {npc.intelligence.description}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {(npc.tags || []).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-900/50 text-indigo-200 rounded-full text-xs">#{tag}</span>
          ))}
        </div>

        <div className="border-t border-slate-700 pt-3">
          <p><span className="text-indigo-400">性格：</span>{npc.personality}</p>
          <p><span className="text-indigo-400">喜好：</span>{(npc.likes || []).join('、')}</p>
          <p><span className="text-indigo-400">厌恶：</span>{(npc.dislikes || []).join('、')}</p>
          <p className="mt-2 text-slate-400 text-xs italic">{npc.backstory}</p>
          <p className="mt-2 text-rose-300 text-xs"><span className="font-bold">理想型：</span>{npc.preference}</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [npcA, setNpcA] = useState<NPC | null>(null);
  const [npcB, setNpcB] = useState<NPC | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MarriageResult | null>(null);
  const [pool, setPool] = useState<NPC[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const fetchNPC = async (slot: 'A' | 'B') => {
    setLoading(true);
    try {
      const npc = await generateRandomNPC();
      if (slot === 'A') setNpcA(npc);
      else setNpcB(npc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNPC('A');
    fetchNPC('B');
  }, []);

  const handleMatch = async () => {
    if (!npcA || !npcB) return;
    setLoading(true);

    try {
      // 1/3 probability for each outcome
      const rand = Math.random();
      let outcome: OutcomeType = OutcomeType.Normal;
      if (rand < 0.33) outcome = OutcomeType.Happy;
      else if (rand > 0.66) outcome = OutcomeType.Bitter;

      const story = await generateMarriageStory(npcA, npcB, outcome);
      
      // Generate 1-5 children
      const childCount = Math.floor(Math.random() * 5) + 1;
      const children: NPC[] = [];

      for (let i = 0; i < childCount; i++) {
        const inherit = (v1: number, v2: number) => {
          const base = (v1 + v2) / 2;
          const variance = (Math.random() - 0.5) * 20; // +/- 10
          return Math.min(100, Math.max(0, Math.floor(base + variance)));
        };

        const pickParent = <T,>(p1: T, p2: T): T => Math.random() > 0.5 ? p1 : p2;

        const childBase: Partial<NPC> = {
          race: pickParent(npcA.race, npcB.race),
          // Social mobility: if happy, might improve. If bitter, might drop.
          socialClass: outcome === OutcomeType.Happy 
            ? Object.values(SocialClass)[Math.min(5, Math.max(0, CLASS_HIERARCHY[pickParent(npcA.socialClass, npcB.socialClass)] + 1))]
            : outcome === OutcomeType.Bitter
            ? Object.values(SocialClass)[Math.max(0, CLASS_HIERARCHY[pickParent(npcA.socialClass, npcB.socialClass)] - 1)]
            : pickParent(npcA.socialClass, npcB.socialClass),
          appearance: {
            score: inherit(npcA.appearance.score, npcB.appearance.score),
            hairColor: pickParent(npcA.appearance.hairColor, npcB.appearance.hairColor),
            eyeColor: pickParent(npcA.appearance.eyeColor, npcB.appearance.eyeColor),
            faceShape: pickParent(npcA.appearance.faceShape, npcB.appearance.faceShape),
            eyeShape: pickParent(npcA.appearance.eyeShape, npcB.appearance.eyeShape),
            description: ''
          },
          combat: { value: inherit(npcA.combat.value, npcB.combat.value), description: '' },
          constitution: { value: inherit(npcA.constitution.value, npcB.constitution.value), description: '' },
          intelligence: { value: inherit(npcA.intelligence.value, npcB.intelligence.value), description: '' },
          generation: Math.max(npcA.generation, npcB.generation) + 1
        };

        const fullChild = await generateRandomNPC(childBase.generation, childBase);
        children.push(fullChild);
      }

      setMatchResult({ outcome, story, children });
      setHistory(prev => [story, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectChildForMatch = (child: NPC, slot: 'A' | 'B') => {
    if (slot === 'A') setNpcA(child);
    else setNpcB(child);
    setMatchResult(null);
  };

  const resetMatch = () => {
    setMatchResult(null);
    fetchNPC('A');
    fetchNPC('B');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent">
          命运红线：姻缘女神的奇幻实验室
        </h1>
        <p className="mt-2 text-slate-400">身为掌管姻缘的女神，你的任务是通过“拉郎”培育出完美的后代，或实现凡人的阶级跨越。</p>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        {!matchResult ? (
          <section className="grid md:grid-cols-2 gap-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                ❤️
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-center text-indigo-400 font-bold text-lg uppercase tracking-widest">候选者 A</h2>
              {npcA && <NPCDisplay npc={npcA} onRefresh={() => fetchNPC('A')} isSlot />}
            </div>

            <div className="space-y-4">
              <h2 className="text-center text-rose-400 font-bold text-lg uppercase tracking-widest">候选者 B</h2>
              {npcB && <NPCDisplay npc={npcB} onRefresh={() => fetchNPC('B')} isSlot />}
            </div>

            <div className="md:col-span-2 flex justify-center mt-8">
              <button
                disabled={loading || !npcA || !npcB}
                onClick={handleMatch}
                className={`px-12 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-xl ${
                  loading ? 'bg-slate-700' : 'bg-gradient-to-r from-rose-500 to-indigo-600 hover:shadow-indigo-500/40'
                }`}
              >
                {loading ? '女神施法中...' : '系上命运红线'}
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-8 animate-in fade-in duration-700">
            <div className="divine-border p-8 rounded-2xl bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">婚后生活录 - <span className={
                  matchResult.outcome === OutcomeType.Happy ? 'text-emerald-400' :
                  matchResult.outcome === OutcomeType.Bitter ? 'text-rose-400' : 'text-slate-300'
                }>{matchResult.outcome}</span></h2>
                <button onClick={resetMatch} className="text-slate-400 hover:text-white underline text-sm">重新开始牵线</button>
              </div>
              <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap">{matchResult.story}</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-center text-amber-300">遗传产物（后代子嗣）</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchResult.children.map((child, idx) => (
                  <div key={child.id} className="relative group">
                    <NPCDisplay npc={child} />
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center space-y-4 transition-opacity rounded-xl">
                      <p className="font-bold text-lg text-white">挑选这位子嗣继续？</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => selectChildForMatch(child, 'A')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded font-bold text-sm"
                        >
                          替换为候选者 A
                        </button>
                        <button
                          onClick={() => selectChildForMatch(child, 'B')}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded font-bold text-sm"
                        >
                          替换为候选者 B
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="pt-12 border-t border-slate-800">
            <h3 className="text-xl font-semibold text-slate-500 mb-6">神之历史记录</h3>
            <div className="space-y-4 opacity-60">
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="p-4 bg-slate-900/30 rounded italic text-sm text-slate-400 line-clamp-2">
                  {h}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 text-center text-slate-600 text-xs pb-10">
        &copy; 姻缘女神的“种豌豆”实验室 - 基于命运红线系统
      </footer>
    </div>
  );
};

export default App;
