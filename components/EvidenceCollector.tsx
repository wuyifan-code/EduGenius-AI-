import React, { useState } from 'react';

/**
 * 前端存证收集组件 (Frontend Evidence Collector UI)
 * 用于协助陪诊师上传多模态数据打卡（音频、图片、情绪标签）
 */
export default function EvidenceCollector({ orderId, currentPathNode }) {
  const [evidenceType, setEvidenceType] = useState('photo');
  
  const handleUpload = () => {
    // 调用后端 DigitalEvidenceService 提交存证
    alert(`[模拟] 已为订单 ${orderId} 在节点 "${currentPathNode}" 上传了 ${evidenceType} 存证数据。订单状态已变更为: EVIDENCE_COLLECTING`);
  };

  return (
    <div className="evidence-collector-panel p-4 border rounded-md shadow bg-white">
      <h3 className="font-bold text-lg text-blue-800 mb-2">数字存证打卡 (Digital Proof)</h3>
      <p className="text-gray-600 mb-4 text-sm">当前任务节点: <span className="text-blue-600 font-semibold">{currentPathNode}</span></p>
      
      <div className="flex space-x-2 mb-4">
        {['photo', 'audio', 'emotion', 'gps'].map(type => (
          <button 
            key={type}
            onClick={() => setEvidenceType(type)}
            className={`px-3 py-1 rounded text-sm ${evidenceType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="upload-area p-6 border-dashed border-2 border-gray-300 text-center rounded bg-gray-50 mb-4 text-gray-400">
        点击此处捕获 {evidenceType} 数据...
      </div>

      <button onClick={handleUpload} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition">
        上传打卡数据沉淀信用档案
      </button>
    </div>
  );
}
