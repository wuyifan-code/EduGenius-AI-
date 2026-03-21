# MediMate 通知系统文档

## 阶段六完成总结

### 任务 6.1: 通知生成机制 ✅

#### 订单相关通知触发点
1. **订单创建时** - 通知患者和陪诊师
   - 文件: `server/src/modules/orders/orders.service.ts`
   - 方法: `create()`

2. **订单状态变更时** - 通知相关方
   - 文件: `server/src/modules/orders/orders.service.ts`
   - 方法: `updateStatus()`, `acceptOrder()`, `startService()`, `completeService()`, `cancelOrder()`

3. **陪诊师接单时** - 通知患者
   - 文件: `server/src/modules/orders/orders.service.ts`
   - 方法: `acceptOrder()`

4. **服务开始/完成时** - 通知患者
   - 文件: `server/src/modules/orders/orders.service.ts`
   - 方法: `startService()`, `completeService()`

#### 支付相关通知触发点
1. **支付成功时** - 通知患者
   - 文件: `server/src/modules/payments/payments.service.ts`
   - 方法: `confirmStripePayment()`, `handleStripeWebhook()`, `handleWechatNotify()`

2. **支付失败时** - 通知患者
   - 文件: `server/src/modules/payments/payments.service.ts`
   - 方法: `handleStripeWebhook()`

#### 退款相关通知触发点
1. **退款申请提交时** - 通知患者
   - 文件: `server/src/modules/payments/payments.service.ts`
   - 方法: `createRefund()`

2. **退款审核通过/拒绝时** - 通知患者
   - 文件: `server/src/modules/payments/payments.service.ts`
   - 方法: `approveRefund()`, `rejectRefund()`

#### 消息相关通知触发点
1. **新消息到达时** - 通知接收者
   - 文件: `server/src/modules/messages/messages.service.ts`
   - 方法: `send()`

### 任务 6.2: 通知 API 完善 ✅

#### API 端点列表

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/notifications` | 获取通知列表（支持分页、未读筛选、类型筛选） |
| GET | `/notifications/unread-count` | 获取未读通知数量 |
| GET | `/notifications/stats` | 获取通知统计信息 |
| PATCH | `/notifications/:id/read` | 标记单个通知为已读 |
| PATCH | `/notifications/read-all` | 标记所有通知为已读 |
| DELETE | `/notifications/:id` | 删除单个通知 |
| DELETE | `/notifications/batch` | 批量删除通知 |

#### 通知类型
- `ORDER` - 订单相关通知
- `ORDER_STATUS` - 订单状态变更通知
- `PAYMENT` - 支付相关通知
- `REFUND` - 退款相关通知
- `MESSAGE` - 消息相关通知
- `REVIEW` - 评价相关通知
- `SYSTEM` - 系统公告

### 任务 6.3: 前端通知功能 ✅

#### 组件列表

1. **Notifications 组件** (`components/Notifications.tsx`)
   - 通知列表展示
   - 支持全部/未读标签切换
   - 标记已读/全部已读
   - 删除通知
   - 点击跳转（订单、支付、消息、退款等）
   - 下拉刷新支持
   - 模拟数据回退

2. **NotificationSettings 组件** (`components/NotificationSettings.tsx`)
   - 应用内通知设置（订单、消息、支付、系统、营销）
   - 通知渠道设置（邮件、推送）
   - 声音设置
   - 浏览器推送权限申请
   - 本地存储和服务器同步

3. **useNotifications Hook** (`hooks/useNotifications.ts`)
   - 通知数据获取和管理
   - 自动轮询未读数量
   - 标记已读/删除操作
   - 播放通知声音
   - 显示浏览器通知

#### API 服务方法 (`services/apiService.ts`)

```typescript
// 获取通知列表
getNotifications(page?, limit?, unreadOnly?, type?)

// 获取未读数量
getUnreadNotificationCount()

// 获取通知统计
getNotificationStats()

// 标记已读
markNotificationAsRead(notificationId)

// 标记全部已读
markAllNotificationsAsRead()

// 删除通知
deleteNotification(notificationId)

// 批量删除
deleteNotifications(notificationIds)

// 更新通知设置
updateNotificationSettings(settings)
```

### 通知跳转逻辑

| 通知类型 | 跳转目标 | 参数 |
|----------|----------|------|
| ORDER / ORDER_STATUS | 订单详情 | orderId |
| PAYMENT | 支付详情 | orderId |
| REFUND | 退款详情 | orderId |
| MESSAGE | 聊天页面 | senderId |
| REVIEW | 评价页面 | orderId |
| SYSTEM | 系统公告 | - |

### 使用示例

#### 在组件中使用通知 Hook
```typescript
import { useNotifications, showBrowserNotification } from '../hooks/useNotifications';

function MyComponent() {
  const { unreadCount, notifications, refresh } = useNotifications(30000);
  
  // 显示浏览器通知
  const handleNotify = () => {
    showBrowserNotification('新消息', {
      body: '您有一条新消息',
      icon: '/icon.png'
    });
  };
  
  return <div>未读通知: {unreadCount}</div>;
}
```

#### 在组件中使用通知设置
```typescript
import { NotificationSettings } from '../components/NotificationSettings';

function SettingsPage() {
  return <NotificationSettings lang="zh" />;
}
```

### 浏览器推送通知

系统支持浏览器原生推送通知，需要：
1. 用户授权通知权限
2. 浏览器支持 Notification API
3. 可选的 Service Worker 支持

### 声音提醒

系统支持通知声音提醒：
- 使用 Web Audio API 生成提示音
- 可在通知设置中开启/关闭
- 设置存储在 localStorage 中

### 文件变更列表

#### 后端文件
- `server/src/modules/notifications/notifications.service.ts` - 扩展通知服务
- `server/src/modules/notifications/notifications.controller.ts` - 扩展控制器
- `server/src/modules/messages/messages.service.ts` - 添加消息通知

#### 前端文件
- `components/Notifications.tsx` - 更新通知组件
- `components/NotificationSettings.tsx` - 新建通知设置组件
- `hooks/useNotifications.ts` - 新建通知 Hook
- `services/apiService.ts` - 扩展 API 方法

### 后续优化建议

1. **WebSocket 实时推送** - 集成 WebSocket 实现实时通知
2. **邮件通知服务** - 集成邮件发送服务
3. **推送订阅管理** - 完整的 Web Push 订阅管理
4. **通知模板** - 支持自定义通知模板
5. **通知历史归档** - 自动归档旧通知
6. **智能通知** - 基于用户行为的智能通知时间

---

**阶段六完成时间**: 2026-03-20
**状态**: ✅ 已完成
