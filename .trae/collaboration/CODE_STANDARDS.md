# MediMate 代码规范文档

## 1. 代码风格

### 1.1 通用规则

- **缩进**：使用 2 空格缩进
- **分号**：语句结尾使用分号
- **引号**：优先使用单引号 `''`
- **换行**：单行不超过 100 字符
- **括号**：对象字面量和箭头函数参数周围保留空格

### 1.2 TypeScript/React 规则

```typescript
// ✅ 正确示例
interface UserProps {
  name: string;
  age: number;
}

const UserComponent: React.FC<UserProps> = ({ name, age }) => {
  return <div>{name}</div>;
};

// ❌ 错误示例
interface userProps {
  name: string
  age: number
}
```

### 1.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `PatientDashboard`, `OrderDetail` |
| 函数 | camelCase | `fetchUserData`, `handleSubmit` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 接口/类型 | PascalCase + 前缀 | `IUserData`, `UserDTO` |
| 枚举 | PascalCase | `UserRole`, `OrderStatus` |
| 文件名 | kebab-case | `user-service.ts`, `order-list.tsx` |
| CSS 类名 | kebab-case | `user-profile`, `order-card` |

### 1.4 组件规范

```typescript
// 组件结构顺序
1. 类型/接口定义
2. 组件定义
3. 内部 hooks
4. 事件处理函数
5. 渲染逻辑
6. 样式定义（如果内联）
```

---

## 2. Git 提交规范

### 2.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2.2 Type 类型

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档变更 |
| style | 代码格式（不影响功能） |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具变更 |

### 2.3 示例

```
feat(patient): 添加订单确认页面

- 实现订单确认表单
- 添加支付方式选择
- 集成微信支付接口

Closes #123
```

---

## 3. 文件结构规范

### 3.1 前端结构

```
src/
├── components/          # UI 组件
│   ├── patient/         # 按角色分类
│   ├── escort/
│   ├── admin/
│   └── common/          # 通用组件
├── pages/              # 页面组件
├── services/           # API 服务
├── hooks/              # 自定义 Hooks
├── contexts/           # React Context
├── types/              # 类型定义
└── utils/              # 工具函数
```

### 3.2 后端结构

```
server/src/
├── modules/            # 功能模块
│   ├── users/
│   ├── orders/
│   └── payments/
├── common/             # 公共模块
│   ├── filters/
│   ├── interceptors/
│   └── decorators/
├── prisma/              # 数据库相关
└── main.ts
```

---

## 4. API 设计规范

### 4.1 URL 规范

```
GET    /api/users          # 获取列表
GET    /api/users/:id      # 获取单个
POST   /api/users          # 创建
PATCH  /api/users/:id      # 更新
DELETE /api/users/:id      # 删除
```

### 4.2 响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  }
}
```

---

## 5. 注释规范

### 5.1 必需注释的场景

1. **复杂业务逻辑**：解释为什么这样做
2. **重要算法**：解释算法思路
3. **临时解决方案**：标记 `// TODO: 后续优化`
4. **API 接口**：说明接口用途和参数

### 5.2 注释格式

```typescript
/**
 * 获取用户订单列表
 * @param userId - 用户ID
 * @param status - 订单状态筛选（可选）
 * @returns 订单列表
 */
async function getUserOrders(userId: string, status?: OrderStatus) {
  // ...
}
```

---

## 6. 错误处理规范

### 6.1 前端错误处理

```typescript
try {
  const result = await apiService.getUserData();
  setUserData(result);
} catch (error) {
  console.error('获取用户数据失败:', error);
  showErrorToast('加载失败，请重试');
}
```

### 6.2 后端错误处理

```typescript
// 使用统一的异常过滤器
throw new HttpException(
  {
    statusCode: HttpStatus.BAD_REQUEST,
    error: 'VALIDATION_ERROR',
    message: '输入数据验证失败',
  },
  HttpStatus.BAD_REQUEST,
);
```

---

## 7. 代码审查要点

### 7.1 必须检查项

- [ ] 代码是否符合命名规范
- [ ] 是否有未处理的错误情况
- [ ] 是否有潜在的安全风险
- [ ] 性能是否有问题
- [ ] 测试是否覆盖关键逻辑
- [ ] 文档是否同步更新

### 7.2 审查通过标准

1. ESLint 和 Prettier 检查通过
2. 所有必须检查项通过
3. 至少一名其他开发者确认
4. 测试覆盖率无明显下降
