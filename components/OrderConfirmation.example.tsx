import React, { useState } from 'react';
import { OrderConfirmation } from './OrderConfirmation';

const exampleEscort = {
  id: 'escort-123',
  name: '王淑芬',
  avatar: 'https://picsum.photos/100/100?random=20',
  rating: 4.9,
  hourly_rate: 150,
  is_verified: true
};

export const OrderConfirmationExample: React.FC = () => {
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const handleSuccess = (orderId: string) => {
    console.warn('Order created successfully:', orderId);
    setLastOrderId(orderId);
    setShowOrderConfirmation(false);
  };

  const handleCancel = () => {
    console.warn('Order confirmation cancelled');
    setShowOrderConfirmation(false);
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setShowOrderConfirmation(true)}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
      >
        打开下单确认页面
      </button>

      {lastOrderId && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700 font-medium">订单创建成功！订单号: {lastOrderId}</p>
        </div>
      )}

      {showOrderConfirmation && (
        <OrderConfirmation
          escort={exampleEscort}
          serviceType="FULL_PROCESS"
          servicePrice={300}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          lang="zh"
        />
      )}
    </div>
  );
};

export default OrderConfirmationExample;
