# RefundModal 退款申请模态框

## 功能特性

✅ 显示订单信息（订单号、金额）
✅ 选择退款原因（单选）
✅ 输入退款说明（可选）
✅ 显示退款金额（默认全额，支持修改）
✅ 表单验证（必须选择原因）
✅ 调用 apiService.requestRefund() API
✅ 成功后回调 onSuccess
✅ 失败显示错误信息
✅ 国际化支持（中文/英文）
✅ 响应式设计，移动端友好

## Props 接口

```typescript
interface RefundModalProps {
  isOpen: boolean;           // 是否显示模态框
  orderId: string;           // 订单ID
  amount: number;            // 订单金额
  onSuccess: () => void;     // 退款成功回调
  onClose: () => void;       // 关闭模态框回调
  lang?: Language;           // 语言设置，默认 'zh'
}
```

## 退款原因选项

- 陪诊师取消 (escort_cancelled)
- 服务不满意 (dissatisfied)
- 临时有事 (schedule_conflict)
- 其他原因 (other)

## 使用示例

```typescript
import { useState } from 'react';
import { RefundModal } from './RefundModal';

const MyComponent = () => {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{id: string; amount: number} | null>(null);

  const handleRefundSuccess = () => {
    console.log('退款申请成功！');
    // 刷新订单列表或更新UI
    setShowRefundModal(false);
    setSelectedOrder(null);
  };

  const openRefundModal = (order: {id: string; amount: number}) => {
    setSelectedOrder(order);
    setShowRefundModal(true);
  };

  return (
    <div>
      {/* 订单列表 */}
      <button onClick={() => openRefundModal({id: 'order_123', amount: 299.00})}>
        申请退款
      </button>

      {/* 退款模态框 */}
      {selectedOrder && (
        <RefundModal
          isOpen={showRefundModal}
          orderId={selectedOrder.id}
          amount={selectedOrder.amount}
          onSuccess={handleRefundSuccess}
          onClose={() => setShowRefundModal(false)}
          lang="zh"
        />
      )}
    </div>
  );
};
```

## API 调用

组件内部调用 `apiService.requestRefund(orderId, amount)` 方法：

```typescript
// apiService.requestRefund
public async requestRefund(
  paymentId: string,  // 订单ID
  amount?: number      // 退款金额（可选，默认全额）
): Promise<{ success: boolean; refundedAmount: number }>
```

## 样式风格

组件采用与项目现有组件一致的样式风格：
- Tailwind CSS 样式
- 渐变背景 (teal-500 to cyan-500)
- 圆角设计 (rounded-2xl)
- 阴影效果 (shadow-2xl)
- 移动端优化的输入框样式
- 统一按钮样式

## 国际化文本

组件支持中文和英文，所有文本通过 `lang` 参数切换。

## 注意事项

1. 组件使用 `fixed inset-0` 实现全屏遮罩
2. 模态框最大高度为 90vh，超出部分可滚动
3. 提交时自动禁用按钮防止重复提交
4. 成功提交后 2 秒自动关闭模态框
5. 错误信息会显示在表单上方
