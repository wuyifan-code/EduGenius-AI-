import React, { useState } from 'react';
import { UserRole } from '../types';
import { X, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/apiService';

interface RegisterProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  lang: 'zh' | 'en';
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register: React.FC<RegisterProps> = ({ onClose, onSwitchToLogin, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.PATIENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const texts = {
    zh: {
      title: '注册 MediMate',
      subtitle: '开启专业的陪诊服务之旅',
      emailLabel: '电子邮箱',
      emailPlaceholder: '请输入邮箱',
      passwordLabel: '密码',
      passwordPlaceholder: '请输入密码',
      confirmPasswordLabel: '确认密码',
      confirmPasswordPlaceholder: '请再次输入密码',
      roleSelection: '选择身份',
      patient: '患者',
      escort: '陪诊师',
      register: '注册',
      agreement: '注册即代表同意《用户协议》和《隐私政策》',
      backToLogin: '返回登录',
      registerFailed: '注册失败',
      registerSuccess: '注册成功',
      registerSuccessMessage: '恭喜您已成功注册，请返回登录页登录',
      invalidEmail: '请输入有效的邮箱地址',
      passwordTooShort: '密码至少需要6位',
      passwordMismatch: '两次输入的密码不一致',
      emailAlreadyExists: '该邮箱已被注册',
      networkError: '网络错误，请稍后重试'
    },
    en: {
      title: 'Register MediMate',
      subtitle: 'Start your professional medical escort journey',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Enter password again',
      roleSelection: 'Select Role',
      patient: 'Patient',
      escort: 'Escort',
      register: 'Register',
      agreement: 'By registering, you agree to our Terms and Privacy Policy',
      backToLogin: 'Back to Login',
      registerFailed: 'Registration Failed',
      registerSuccess: 'Registration Success',
      registerSuccessMessage: 'Congratulations! You have successfully registered. Please go back to login.',
      invalidEmail: 'Please enter a valid email address',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      emailAlreadyExists: 'This email is already registered',
      networkError: 'Network error, please try again later'
    }
  };

  const t = texts[lang];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!validateEmail(email)) {
      newErrors.email = t.invalidEmail;
    }

    if (!validatePassword(password)) {
      newErrors.password = t.passwordTooShort;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.register({
        email,
        password,
        role: selectedRole
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.response?.data?.message?.includes('already exists')) {
        setError(t.emailAlreadyExists);
      } else {
        setError(t.networkError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (pwd.length === 0) {
      return { level: 0, label: '', color: '' };
    }
    if (pwd.length < 6) {
      return { level: 1, label: lang === 'zh' ? '弱' : 'Weak', color: 'bg-red-500' };
    }
    if (pwd.length < 10) {
      return { level: 2, label: lang === 'zh' ? '中' : 'Medium', color: 'bg-yellow-500' };
    }
    return { level: 3, label: lang === 'zh' ? '强' : 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
    if (errors.confirmPassword) {
      setErrors({ ...errors, confirmPassword: undefined });
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors({ ...errors, confirmPassword: undefined });
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col min-h-[500px]">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-6 w-6 text-slate-500" />
            </button>
            <div className="font-bold text-lg text-slate-400">MediMate</div>
            <div className="w-10"></div>
          </div>

          {/* Success Content */}
          <div className="flex-1 px-4 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">{t.registerSuccess}</h2>
            <p className="text-slate-500 mb-8 text-center">{t.registerSuccessMessage}</p>

            <button
              onClick={onSwitchToLogin}
              className="w-full bg-black text-white rounded-full py-4 font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {t.backToLogin}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col min-h-[600px]">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
          <div className="font-bold text-lg text-slate-400">MediMate</div>
          <div className="w-10"></div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 overflow-y-auto">
          <h1 className="text-3xl font-black text-slate-900 mb-2">{t.title}</h1>
          <p className="text-slate-500 mb-6">{t.subtitle}</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-600">
                <div className="font-medium">{t.registerFailed}</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.roleSelection}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-colors ${selectedRole === UserRole.PATIENT
                      ? 'bg-teal-600 text-white'
                      : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                  onClick={() => setSelectedRole(UserRole.PATIENT)}
                >
                  {t.patient}
                </button>
                <button
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-colors ${selectedRole === UserRole.ESCORT
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  onClick={() => setSelectedRole(UserRole.ESCORT)}
                >
                  {t.escort}
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.emailLabel}</label>
              <div className={`border-b-2 ${errors.email ? 'border-red-500' : 'border-slate-100'} focus-within:border-black transition-colors py-2`}>
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900 w-full"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.passwordLabel}</label>
              <div className={`border-b-2 ${errors.password ? 'border-red-500' : 'border-slate-100'} focus-within:border-black transition-colors py-2`}>
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900 w-full"
                />
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-slate-200'}`}></div>
                  </div>
                  {passwordStrength.level > 0 && (
                    <p className="text-xs text-slate-500">
                      {lang === 'zh' ? '密码强度：' : 'Password strength: '}{passwordStrength.label}
                    </p>
                  )}
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.confirmPasswordLabel}</label>
              <div className={`border-b-2 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-100'} focus-within:border-black transition-colors py-2`}>
                <input
                  type="password"
                  placeholder={t.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900 w-full"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Register Button */}
            <button
              className="w-full bg-black text-white rounded-full py-4 font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRegister}
              disabled={loading || !email || !password || !confirmPassword}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {t.register}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center leading-relaxed px-4">
              {t.agreement}
            </p>

            {/* Back to Login Link */}
            <button
              onClick={onSwitchToLogin}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToLogin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
