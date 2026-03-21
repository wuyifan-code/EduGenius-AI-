import React from 'react';

/**
 * 叙事医学康复备忘录展示页 (Recovery Memo Viewer UI)
 * 向患者家属展示大语言模型 (MiniMax LLM) 提炼提炼出的人文关怀医学记录
 */
export default function RecoveryMemoViewer({ memoData }) {
  if (!memoData) return <div className="text-gray-500 italic p-4">康复备忘录正在生成中 (Generating Recovery Memo...)</div>;

  return (
    <div className="recovery-memo-viewer bg-[#fbf9f4] p-6 rounded-xl shadow-lg border-l-4 border-l-orange-400 relative">
      <div className="absolute top-4 right-4 text-xs font-mono text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
        Powered by MiniMax LLM
      </div>
      
      <h2 className="text-2xl font-serif text-orange-800 mb-4 flex items-center">
        <span className="mr-2">📝</span> 康复备忘录 (Recovery Memo)
      </h2>
      
      <div className="prose prose-orange max-w-none text-gray-700 leading-relaxed font-serif whitespace-pre-wrap">
        {memoData.content}
      </div>
      
      <div className="mt-8 pt-4 border-t border-orange-100 text-xs text-orange-600 flex justify-between items-center opacity-80">
        <span>基于 {memoData.evidenceCount || 4} 份医疗存证数据多模态提炼生成</span>
        <span>为您记录每份爱的回响</span>
      </div>
    </div>
  );
}
