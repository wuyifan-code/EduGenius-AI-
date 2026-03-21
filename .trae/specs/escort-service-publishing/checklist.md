# Checklist

## Database
- [x] escort_services 表已创建，包含所有必需字段
- [x] service_bookings 表已创建，包含所有必需字段
- [x] 数据库迁移文件已生成并应用
- [x] Prisma schema 已更新

## Backend API
- [x] POST /api/escorts/services 创建服务发布 API 正常工作
- [x] GET /api/escorts/services 获取陪诊师服务列表 API 正常工作
- [x] GET /api/escorts/services/all 获取所有可预约服务 API 正常工作
- [x] PATCH /api/escorts/services/:id 更新服务 API 正常工作
- [x] DELETE /api/escorts/services/:id 删除服务 API 正常工作
- [x] PATCH /api/escorts/services/:id/toggle 暂停/恢复服务 API 正常工作
- [x] GET /api/escorts/services/:id/availability 查询可用时段 API 正常工作
- [x] POST /api/escorts/services/:id/book 预约服务 API 正常工作
- [x] 订单创建时自动创建 service_bookings 记录
- [x] 订单取消时自动释放 service_bookings 时段

## Frontend - Escort (陪诊师端)
- [x] ServicePublishModal 组件可正常打开和关闭
- [x] 服务类型选择功能正常
- [x] 日期范围选择器功能正常
- [x] 星期选择器功能正常
- [x] 时间段设置功能正常（可添加/删除时段）
- [x] 价格设置功能正常
- [x] 医院/区域选择功能正常
- [x] 服务描述和标签输入功能正常
- [x] 提交表单后服务发布成功
- [x] EscortDashboard 显示"我的服务"入口
- [x] EscortServiceList 显示已发布服务列表
- [x] 服务卡片显示正确信息
- [x] 编辑功能正常工作
- [x] 暂停/恢复功能正常工作
- [x] 删除功能正常工作（带确认）

## Frontend - Patient (患者端)
- [x] PatientDashboard 显示"可预约陪诊师"板块
- [x] AvailableEscorts 组件显示服务列表
- [x] 服务卡片显示陪诊师信息、时间、价格
- [x] 筛选功能正常工作（类型、区域、价格）
- [x] 排序功能正常工作（评分、价格、距离）
- [x] 点击卡片进入预约流程
- [x] OrderConfirmation 支持从服务发布预约
- [x] 时段选择器显示可预约时段
- [x] 服务类型和价格自动预填充
- [x] 订单创建成功

## Header
- [x] 陪诊师"接单模式"按钮显示正确
- [x] 点击后显示发布服务/查看我的服务选项
- [x] 选项功能正常工作

## Integration
- [x] 端到端测试通过：陪诊师发布 → 患者浏览 → 患者预约 → 订单创建
- [x] 时段冲突检测正常工作
- [x] 订单取消后时段释放正常工作
- [x] 服务暂停后不可预约
- [x] 深色模式适配正常
- [x] 移动端适配正常
