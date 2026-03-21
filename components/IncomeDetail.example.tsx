import React, { useState } from 'react';
import { IncomeDetail } from './IncomeDetail';
import { Language } from '../types';

interface ExampleUsageProps {
  lang: Language;
}

export const IncomeDetailExample: React.FC<ExampleUsageProps> = ({ lang }) => {
  const [showIncomeDetail, setShowIncomeDetail] = useState(false);

  const handleBack = () => {
    setShowIncomeDetail(false);
    console.log('Back to previous page');
  };

  if (showIncomeDetail) {
    return <IncomeDetail lang={lang} onBack={handleBack} />;
  }

  return (
    <div className="p-4">
      <button
        onClick={() => setShowIncomeDetail(true)}
        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
      >
        {lang === 'zh' ? '查看收入明细' : 'View Income Details'}
      </button>
    </div>
  );
};
