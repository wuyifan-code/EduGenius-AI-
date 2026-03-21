# Tasks

## Task 1: 数据库迁移 - 创建陪诊师服务发布表
- [x] 创建 escort_services 表（陪诊师服务发布表）
- [x] 创建 service_bookings 表（服务预约时段表）
- [x] 运行 Prisma migrate 生成迁移文件
- [x] 验证数据库表结构正确

## Task 2: 后端 API 开发 - 服务发布管理
- [x] 创建 CreateEscortServiceDto 和 UpdateEscortServiceDto
- [x] 实现 POST /api/escorts/services 创建服务发布
- [x] 实现 GET /api/escorts/services 获取陪诊师自己的服务列表
- [x] 实现 GET /api/escorts/services/all 获取所有可预约服务（患者端）
- [x] 实现 PATCH /api/escorts/services/:id 更新服务信息
- [x] 实现 DELETE /api/escorts/services/:id 删除服务发布
- [x] 实现 PATCH /api/escorts/services/:id/toggle 暂停/恢复服务

## Task 3: 后端 API 开发 - 服务预约管理
- [x] 实现 GET /api/escorts/services/:id/availability 查询服务可用时段
- [x] 实现 POST /api/escorts/services/:id/book 预约服务时段
- [x] 实现订单创建时自动创建 service_bookings 记录
- [x] 实现订单取消时自动释放 service_bookings 时段

## Task 4: 前端开发 - 陪诊师服务发布页面
- [x] 创建 ServicePublishModal 组件（服务发布弹窗）
- [x] 实现服务类型选择（全程陪诊/代约挂号/代取报告/专车接送）
- [x] 实现日期范围选择器（开始日期-结束日期）
- [x] 实现星期选择器（周一到周日多选）
- [x] 实现时间段设置（可添加多个时段）
- [x] 实现价格设置输入框
- [x] 实现医院/区域选择
- [x] 实现服务描述和标签输入
- [x] 集成 API 提交服务发布

## Task 5: 前端开发 - 陪诊师服务管理页面
- [x] 在 EscortDashboard 添加"我的服务"入口
- [x] 创建 EscortServiceList 组件显示已发布服务
- [x] 实现服务卡片（显示服务信息、状态、预约统计）
- [x] 实现编辑功能（打开编辑弹窗）
- [x] 实现暂停/恢复功能
- [x] 实现删除功能（带确认弹窗）

## Task 6: 前端开发 - 患者端服务浏览
- [x] 在 PatientDashboard 添加"可预约陪诊师"板块
- [x] 创建 AvailableEscorts 组件显示可预约服务列表
- [x] 实现服务卡片（显示陪诊师信息、可预约时间、价格）
- [x] 实现筛选功能（按服务类型、区域、价格筛选）
- [x] 实现排序功能（按评分、价格、距离排序）
- [x] 点击卡片进入预约流程

## Task 7: 前端开发 - 预约流程优化
- [x] 修改 OrderConfirmation 组件支持从服务发布直接预约
- [x] 实现时段选择器（显示可预约的具体时段）
- [x] 预填充服务类型和价格信息
- [x] 优化订单创建流程

## Task 8: 前端开发 - Header 按钮适配
- [x] 修改 Header 组件中陪诊师的"接单模式"按钮
- [x] 点击后显示选项：发布服务 / 查看我的服务
- [x] 根据当前状态显示不同图标和文字

## Task 9: 集成测试
- [x] 测试陪诊师发布服务完整流程
- [x] 测试患者浏览和预约服务流程
- [x] 测试服务时段冲突检测
- [x] 测试订单取消后时段释放
- [x] 测试服务暂停后不可预约

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 2
- Task 5 依赖 Task 4
- Task 6 依赖 Task 2
- Task 7 依赖 Task 3 和 Task 6
- Task 8 依赖 Task 4
- Task 9 依赖所有前端和后端任务
