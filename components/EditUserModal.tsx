import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, User, Shield, Phone, Ban, Unlock, Loader2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Language, UserRole } from '../types';

interface EditUserModalProps {
  isOpen: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    isActive: boolean;
    phone?: string;
  };
  onSuccess: () => void;
  onClose: () => void;
  lang?: Language;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onSuccess,
  onClose,
  lang = 'zh'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: UserRole.PATIENT,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const texts = {
    zh: {
      title: '编辑用户',
      userInfo: '用户信息',
      email: '邮箱',
      name: '姓名',
      namePlaceholder: '请输入用户姓名',
      phone: '手机号',
      phonePlaceholder: '请输入手机号',
      role: '角色',
      status: '状态',
      active: '正常',
      inactive: '已禁用',
      save: '保存',
      saving: '保存中...',
      cancel: '取消',
      updateSuccess: '用户信息更新成功',
      updateFailed: '更新失败',
      nameRequired: '姓名不能为空',
      nameMaxLength: '姓名最多50个字符',
      phoneInvalid: '手机号格式不正确',
      networkError: '网络错误，请检查网络连接',
      patient: '患者',
      escort: '陪诊师',
      admin: '管理员',
      guest: '访客'
    },
    en: {
      title: 'Edit User',
      userInfo: 'User Information',
      email: 'Email',
      name: 'Name',
      namePlaceholder: 'Enter user name',
      phone: 'Phone',
      phonePlaceholder: 'Enter phone number',
      role: 'Role',
      status: 'Status',
      active: 'Active',
      inactive: 'Disabled',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      updateSuccess: 'User updated successfully',
      updateFailed: 'Update failed',
      nameRequired: 'Name is required',
      nameMaxLength: 'Name cannot exceed 50 characters',
      phoneInvalid: 'Invalid phone number format',
      networkError: 'Network error, please check your connection',
      patient: 'Patient',
      escort: 'Escort',
      admin: 'Admin',
      guest: 'Guest'
    }
  };

  const t = texts[lang];

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError(t.nameRequired);
      return false;
    }

    if (formData.name.length > 50) {
      setError(t.nameMaxLength);
      return false;
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError(t.phoneInvalid);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const updateData: {
        name: string;
        phone?: string;
        role?: string;
        isActive?: boolean;
      } = {
        name: formData.name.trim()
      };

      if (formData.phone) {
        updateData.phone = formData.phone.trim();
      }

      if (formData.role !== user.role) {
        updateData.role = formData.role;
      }

      if (formData.isActive !== user.isActive) {
        updateData.isActive = formData.isActive;
      }

      await apiService.updateUser(user.id, updateData);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Update user error:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else {
          setError(t.updateFailed);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t.updateFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      [UserRole.PATIENT]: t.patient,
      [UserRole.ESCORT]: t.escort,
      [UserRole.ADMIN]: t.admin,
      [UserRole.GUEST]: t.guest
    };
    return roleLabels[role] || role;
  };

  const roles = [
    { value: UserRole.PATIENT, label: t.patient },
    { value: UserRole.ESCORT, label: t.escort },
    { value: UserRole.ADMIN, label: t.admin },
    { value: UserRole.GUEST, label: t.guest }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
          <h2 className="font-bold text-lg text-slate-900">{t.title}</h2>
          <div className="w-10"></div>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t.updateSuccess}</h3>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-4 mb-6 text-white">
              <div className="text-sm opacity-90 mb-1">{t.userInfo}</div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 opacity-80" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  formData.role === UserRole.ADMIN ? 'bg-red-500' :
                  formData.role === UserRole.ESCORT ? 'bg-purple-500' :
                  'bg-blue-500'
                }`}>
                  {getRoleLabel(formData.role)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  formData.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {formData.isActive ? t.active : t.inactive}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-600">
                  <div className="font-medium">{t.updateFailed}</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {t.name} <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-slate-100 rounded-xl focus-within:border-teal-500 transition-colors">
                  <div className="flex items-center gap-2 px-3">
                    <User className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.namePlaceholder}
                      maxLength={50}
                      className="flex-1 py-3 outline-none bg-transparent placeholder-slate-400 text-slate-900"
                      disabled={loading}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400 text-right">
                  {formData.name.length}/50
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {t.phone}
                </label>
                <div className="border-2 border-slate-100 rounded-xl focus-within:border-teal-500 transition-colors">
                  <div className="flex items-center gap-2 px-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.phonePlaceholder}
                      className="flex-1 py-3 outline-none bg-transparent placeholder-slate-400 text-slate-900"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  {t.role}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.role === role.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={() => setFormData({ ...formData, role: role.value })}
                        className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                        disabled={loading}
                      />
                      <Shield className={`h-4 w-4 ${
                        formData.role === role.value ? 'text-teal-600' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.role === role.value ? 'text-teal-700' : 'text-slate-700'
                      }`}>
                        {role.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  {t.status}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, isActive: true })}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.isActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Unlock className={`h-5 w-5 ${
                      formData.isActive ? 'text-green-600' : 'text-slate-400'
                    }`} />
                    <span className={`font-medium ${
                      formData.isActive ? 'text-green-700' : 'text-slate-700'
                    }`}>
                      {t.active}
                    </span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, isActive: false })}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      !formData.isActive
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Ban className={`h-5 w-5 ${
                      !formData.isActive ? 'text-red-600' : 'text-slate-400'
                    }`} />
                    <span className={`font-medium ${
                      !formData.isActive ? 'text-red-700' : 'text-slate-700'
                    }`}>
                      {t.inactive}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 flex-shrink-0">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-full text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-bold hover:from-teal-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {t.save}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;
