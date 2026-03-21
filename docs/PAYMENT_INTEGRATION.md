# MediMate 支付系统对接文档

## 阶段四完成总结

### 已完成功能

#### 1. 微信支付集成 (任务 4.1) ✅
- 安装了微信支付 SDK (`wechatpay-node-v3`)
- 实现了微信支付 V3 API 集成
- 实现了支付订单创建 API (`POST /api/payments/wechat/create-order`)
- 实现了支付二维码生成
- 实现了支付回调处理 (`POST /api/payments/wechat/notify`)
- 实现了支付状态查询 (`GET /api/payments/wechat/query/:orderId`)

#### 2. 前端支付页面 (任务 4.2) ✅
- 完善了 `WeChatPayment` 组件
- 实现了二维码展示和刷新功能
- 实现了支付状态轮询（每3秒查询一次）
- 实现了支付成功/失败/超时页面
- 支持双语（中英文）

#### 3. 退款功能 (任务 4.3) ✅
- 数据库新增 `Refund` 表和 `RefundStatus` 枚举
- 实现了退款申请 API (`POST /api/payments/refunds`)
- 实现了退款审核 API（管理员）
  - 通过退款: `POST /api/payments/refunds/:refundId/approve`
  - 拒绝退款: `POST /api/payments/refunds/:refundId/reject`
- 实现了退款状态查询 API
  - 用户查询: `GET /api/payments/refunds/my`
  - 管理员查询: `GET /api/payments/refunds`
- 完善了 `RefundModal` 组件

#### 4. 支付相关通知 (任务 4.4) ✅
- 支付成功时自动生成通知
- 退款申请提交时生成通知
- 退款审核通过/拒绝时生成通知
- 实现了支付安全验证（签名验证）

### 数据库变更

#### 新增表
```prisma
model Refund {
  id            String        @id @default(uuid())
  paymentId     String        @map("payment_id")
  orderId       String        @map("order_id")
  userId        String        @map("user_id")
  amount        Float         // 退款金额 (分)
  reason        String        // 退款原因
  reasonType    String        @map("reason_type")
  description   String?       // 退款说明
  status        RefundStatus  @default(PENDING)
  reviewedBy    String?       @map("reviewed_by")
  reviewedAt    DateTime?     @map("reviewed_at")
  reviewNote    String?       @map("review_note")
  wechatRefundId String?      @unique @map("wechat_refund_id")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  payment Payment @relation(fields: [paymentId], references: [id])

  @@index([paymentId])
  @@index([orderId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("refunds")
}
```

#### 新增枚举
```prisma
enum RefundStatus {
  PENDING    // 待审核
  APPROVED   // 审核通过
  REJECTED   // 审核拒绝
  PROCESSING // 退款处理中
  COMPLETED  // 退款完成
  FAILED     // 退款失败
}
```

#### Payment 表更新
- 新增 `wechatPrepayId` 字段
- 新增 `refunds` 关系

### 环境变量配置

在 `server/.env` 文件中添加以下配置：

```env
# WeChat Pay (微信支付)
WECHAT_PAY_APPID="your-app-id"
WECHAT_PAY_MCHID="your-merchant-id"
WECHAT_PAY_APIV3_KEY="your-api-v3-key"
WECHAT_PAY_SERIAL_NO="your-certificate-serial-no"
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WECHAT_PAY_NOTIFY_URL="http://your-domain/api/payments/wechat/notify"
```

### API 接口列表

#### 微信支付接口
| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/payments/wechat/create-order | 创建支付订单 | 是 |
| POST | /api/payments/wechat/notify | 支付回调通知 | 否 |
| GET | /api/payments/wechat/query/:orderId | 查询支付状态 | 是 |

#### 退款接口
| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/payments/refunds | 创建退款申请 | 是 |
| GET | /api/payments/refunds/my | 获取我的退款 | 是 |
| GET | /api/payments/refunds | 获取所有退款（管理员） | 是 |
| POST | /api/payments/refunds/:id/approve | 通过退款（管理员） | 是 |
| POST | /api/payments/refunds/:id/reject | 拒绝退款（管理员） | 是 |
| GET | /api/payments/refunds/:id | 获取退款详情 | 是 |

#### 支付查询接口
| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/payments/:orderId | 获取订单支付信息 | 是 |

### 支付流程

```
1. 用户确认订单后点击"去支付"
2. 前端调用 POST /api/payments/wechat/create-order
3. 后端调用微信支付 API 创建支付订单
4. 后端返回支付二维码 URL (code_url)
5. 前端生成二维码展示给用户
6. 用户微信扫码支付
7. 微信支付回调通知后端 (POST /api/payments/wechat/notify)
8. 后端更新订单状态为 PAID/CONFIRMED
9. 前端轮询查询支付状态 (每3秒)
10. 支付成功跳转成功页面
```

### 退款流程

```
1. 用户点击"申请退款"
2. 填写退款原因和金额
3. 前端调用 POST /api/payments/refunds
4. 后端创建退款记录，状态为 PENDING
5. 订单状态变为 REFUNDING
6. 管理员在后台看到退款申请
7. 管理员审核通过/拒绝
8. 如果通过，调用支付渠道退款 API
9. 更新退款状态为 COMPLETED
10. 用户收到退款通知
```

### 安全验证

1. **微信支付签名验证**: 使用 RSA-SHA256 签名
2. **回调通知解密**: 使用 AES-256-GCM 解密
3. **用户权限验证**: 确保用户只能操作自己的订单
4. **金额验证**: 退款金额不能超过支付金额

### 测试模式

如果未配置微信支付参数，系统会自动进入模拟模式：
- 生成模拟的支付二维码
- 模拟支付成功（可以通过调用确认接口模拟）
- 退款流程正常执行（不调用真实 API）

### 注意事项

1. 微信支付需要配置正确的证书和密钥
2. 回调地址需要是公网可访问的 URL
3. 生产环境需要配置 HTTPS
4. 退款审核需要管理员权限
5. 建议定期备份支付相关数据
