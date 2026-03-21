# 陪诊师服务发布功能 Spec

## Why
当前 MediMate 平台只有患者下单功能，陪诊师只能被动接单。为了提升陪诊师的主动性和平台的服务覆盖范围，需要添加陪诊师主动发布可预约时段和服务的功能，让陪诊师可以主动展示自己的可用时间，患者可以直接预约。

## What Changes
- **新增** 陪诊师服务发布页面/弹窗
- **新增** 服务时段管理功能（可预约时间设置）
- **新增** 服务价格自定义功能
- **新增** 服务标签/专长设置
- **新增** 患者端服务浏览和预约入口
- **新增** 服务端 API：创建/编辑/删除服务发布
- **新增** 数据库表：escort_services（陪诊师服务发布表）

## Impact
- Affected specs: 陪诊师 Dashboard、患者首页服务展示
- Affected code: 
  - Frontend: EscortDashboard.tsx, PatientDashboard.tsx, Header.tsx
  - Backend: escorts.module, escorts.service, escorts.controller
  - Database: 新增 escort_services 表

## ADDED Requirements

### Requirement: 陪诊师服务发布功能
陪诊师 SHALL 能够发布自己的可预约服务时段，包括服务类型、时间、价格等信息。

#### Scenario: 陪诊师发布服务
- **GIVEN** 陪诊师已登录并进入 Dashboard
- **WHEN** 点击"发布服务"按钮
- **THEN** 显示服务发布表单，包含：
  - 服务类型选择（全程陪诊/代约挂号/代取报告/专车接送）
  - 可预约日期范围设置
  - 每日可预约时间段设置
  - 服务价格设置（可差异化定价）
  - 服务区域/医院选择
  - 服务描述/专长标签
- **WHEN** 提交表单
- **THEN** 服务发布成功，显示在患者端可预约列表

#### Scenario: 患者浏览和预约陪诊师服务
- **GIVEN** 患者进入首页或探索页面
- **WHEN** 浏览"可预约陪诊师"板块
- **THEN** 显示所有已发布服务的陪诊师列表，包含：
  - 陪诊师基本信息（头像、评分、认证状态）
  - 可预约时间
  - 服务价格
  - 服务类型
- **WHEN** 点击"立即预约"
- **THEN** 直接进入订单确认页面，无需再次选择服务类型

#### Scenario: 陪诊师管理服务发布
- **GIVEN** 陪诊师已发布服务
- **WHEN** 进入"我的服务"页面
- **THEN** 可以：
  - 查看当前发布的服务列表
  - 编辑服务信息（时间、价格等）
  - 暂停/恢复服务发布
  - 删除服务发布

#### Scenario: 服务预约状态管理
- **GIVEN** 患者预约了陪诊师的服务时段
- **WHEN** 预约成功
- **THEN** 该时段自动标记为"已预约"，其他患者无法重复预约
- **WHEN** 订单取消或完成
- **THEN** 该时段恢复为"可预约"状态

## MODIFIED Requirements
### Requirement: 订单创建流程
**修改前**: 患者选择服务类型 → 选择陪诊师 → 确认订单
**修改后**: 
- 方式1（原有）: 患者选择服务类型 → 选择陪诊师 → 确认订单
- 方式2（新增）: 患者浏览陪诊师发布的服务 → 选择时段 → 直接预约

## Database Schema

```sql
-- 陪诊师服务发布表
CREATE TABLE escort_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escort_id UUID NOT NULL REFERENCES users(id),
  service_type VARCHAR(50) NOT NULL, -- FULL_PROCESS, APPOINTMENT, REPORT_PICKUP, VIP_TRANSPORT
  title VARCHAR(200),
  description TEXT,
  price_per_hour DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  available_weekdays INTEGER[] NOT NULL, -- [1,2,3,4,5,6,7] 表示周一到周日
  time_slots JSONB NOT NULL, -- [{"start": "09:00", "end": "12:00"}, ...]
  hospitals UUID[], -- 可服务的医院ID列表
  areas VARCHAR(100)[], -- 服务区域
  tags VARCHAR(50)[], -- 专长标签
  is_active BOOLEAN DEFAULT true,
  max_daily_orders INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 服务预约时段表（记录具体哪些时段已被预约）
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES escort_services(id),
  order_id UUID REFERENCES orders(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'available', -- available, booked, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
