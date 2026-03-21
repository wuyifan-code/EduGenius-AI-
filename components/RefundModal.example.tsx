import React, { useState } from 'react';
import { RefundModal } from './RefundModal';

const ExampleUsage: React.FC = () => {
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  const handleRefundSuccess = () => {
    console.log('Refund successful!');
    // 刷新订单列表或更新UI
    setShowRefundModal(false);
  };

  return (
    <div>
      {/* 在需要的地方打开退款模态框 */}
      <button onClick={() => setShowRefundModal(true)}>
        申请退款
      </button>

      <RefundModal
        isOpen={showRefundModal}
        orderId="order_123456789"
        amount={299.00}
        onSuccess={handleRefundSuccess}
        onClose={() => setShowRefundModal(false)}
        lang="zh"
      />
    </div>
  );
};

export default ExampleUsage;
