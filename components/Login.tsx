import React, { useState } from 'react';
import { UserRole } from '../types';
import { X, ArrowRight, AlertCircle, Mail, Lock, User, Phone } from 'lucide-react';
import { apiService } from '../services/apiService';

interface LoginProps {
  setRole: (role: UserRole) => void;
  onClose: () => void;
  onLoginSuccess?: (userData: { id: string; email: string; role: UserRole }) => void;
  lang: 'zh' | 'en';
}

export const Login: React.FC<LoginProps> = ({ setRole, onClose, onLoginSuccess, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.PATIENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const texts = {
    zh: {
      title: '登录 MediMate',
      subtitle: '专业的陪诊服务平台',
      systemVersion: '基于多约束准则的medimate医疗陪护资源动态调度与最优适配系统 V1.0',
      emailLabel: '电子邮箱',
      emailPlaceholder: '请输入邮箱',
      passwordLabel: '密码',
      passwordPlaceholder: '请输入密码',
      login: '登录',
      agreement: '登录即代表同意《用户协议》和《隐私政策》',
      guest: '先逛逛',
      roleSelection: '选择身份',
      patient: '患者',
      escort: '陪诊师',
      loginFailed: '登录失败',
      invalidCredentials: '邮箱或密码错误',
      networkError: '网络错误，请稍后重试',
      forgotPassword: '忘记密码',
      forgotPasswordTitle: '重置密码',
      forgotPasswordDesc: '请输入您的注册邮箱，我们将发送重置密码链接',
      sendResetLink: '发送重置链接',
      resetLinkSent: '重置链接已发送到您的邮箱',
      backToLogin: '返回登录',
      noAccount: '没有账号？',
      registerNow: '立即注册',
      register: '注册',
      registerTitle: '注册 MediMate',
      registerSubtitle: '加入我们，开始您的陪诊之旅',
      nameLabel: '姓名',
      namePlaceholder: '请输入姓名',
      phoneLabel: '手机号',
      phonePlaceholder: '请输入手机号',
      confirmPasswordLabel: '确认密码',
      confirmPasswordPlaceholder: '请再次输入密码',
      registerSuccess: '注册成功！请登录',
      passwordMismatch: '两次密码输入不一致',
      registerFailed: '注册失败，请稍后重试'
    },
    en: {
      title: 'Login to MediMate',
      subtitle: 'Professional Medical Escort Platform',
      systemVersion: 'Medimate Medical Escort Resource Dynamic Scheduling and Optimal Matching System V1.0',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password',
      login: 'Login',
      agreement: 'By logging in, you agree to our Terms and Privacy Policy',
      guest: 'Browse as Guest',
      roleSelection: 'Select Role',
      patient: 'Patient',
      escort: 'Escort',
      loginFailed: 'Login Failed',
      invalidCredentials: 'Invalid email or password',
      networkError: 'Network error, please try again later',
      forgotPassword: 'Forgot Password',
      forgotPasswordTitle: 'Reset Password',
      forgotPasswordDesc: 'Enter your registered email, we will send a password reset link',
      sendResetLink: 'Send Reset Link',
      resetLinkSent: 'Reset link has been sent to your email',
      backToLogin: 'Back to Login',
      noAccount: "Don't have an account?",
      registerNow: 'Register Now',
      register: 'Register',
      registerTitle: 'Register MediMate',
      registerSubtitle: 'Join us and start your medical escort journey',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      phoneLabel: 'Phone',
      phonePlaceholder: 'Enter phone number',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Please enter password again',
      registerSuccess: 'Registration successful! Please login',
      passwordMismatch: 'Passwords do not match',
      registerFailed: 'Registration failed, please try again later'
    }
  };

  const t = texts[lang];

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t.invalidCredentials);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.login({
        email,
        password,
        role: selectedRole
      });
      
      const userRole = response.user?.role || selectedRole;
      setRole(userRole);
      // Call onLoginSuccess to update user state in parent
      if (onLoginSuccess && response.user) {
        onLoginSuccess({
          id: response.user.id,
          email: response.user.email,
          role: response.user.role
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t.networkError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      return;
    }
    
    setLoading(true);
    setForgotSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.confirmPassword) {
      setRegisterError(t.invalidCredentials);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError(t.passwordMismatch);
      return;
    }

    setRegisterLoading(true);
    setRegisterError('');

    try {
      await apiService.register({
        email: registerData.email,
        password: registerData.password,
        role: selectedRole,
        name: registerData.name,
        phone: registerData.phone
      });
      
      setRegisterSuccess(true);
      setTimeout(() => {
        setShowRegister(false);
        setRegisterSuccess(false);
        setRegisterData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          phone: ''
        });
      }, 2000);
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.response?.data?.message) {
        setRegisterError(err.response.data.message);
      } else {
        setRegisterError(t.registerFailed);
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col min-h-[500px]">
          
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

          <div className="flex-1 px-4">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{t.title}</h1>
            <p className="text-slate-500 mb-2">{t.subtitle}</p>
            <p className="text-xs text-slate-400 mb-8 italic">{t.systemVersion}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-600">
                  <div className="font-medium">{t.loginFailed}</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.emailLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.passwordLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input
                    type="password"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                  />
                </div>
              </div>

              <button
                className="w-full bg-black text-white rounded-full py-4 font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleLogin}
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t.login
                )}
              </button>

              <p className="text-xs text-slate-400 text-center leading-relaxed px-4">
                {t.agreement}
              </p>

              <div className="text-center mt-4">
                <button 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {t.forgotPassword}
                </button>
              </div>

              <div className="text-center mt-4">
                <span className="text-sm text-slate-500">{t.noAccount} </span>
                <button
                  onClick={() => setShowRegister(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-bold"
                >
                  {t.registerNow}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSuccess(false);
                }}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
              <div className="font-bold text-lg text-slate-400">MediMate</div>
              <div className="w-10"></div>
            </div>

            <div className="px-2">
              <h2 className="text-2xl font-black text-slate-900 mb-2">{t.forgotPasswordTitle}</h2>
              <p className="text-slate-500 mb-6">{t.forgotPasswordDesc}</p>
              
              {forgotSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-600">
                    <div>{t.resetLinkSent}</div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.emailLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input 
                    type="email" 
                    placeholder={t.emailPlaceholder}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <button 
                className="w-full bg-teal-600 text-white rounded-full py-4 font-bold text-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleForgotPassword}
                disabled={loading || !forgotEmail || forgotSuccess}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t.sendResetLink
                )}
              </button>

              <div className="text-center mt-4">
                <button 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSuccess(false);
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {t.backToLogin}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => {
                  setShowRegister(false);
                  setRegisterError('');
                  setRegisterSuccess(false);
                }}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
              <div className="font-bold text-lg text-slate-400">MediMate</div>
              <div className="w-10"></div>
            </div>

            <div className="px-2">
              <h2 className="text-2xl font-black text-slate-900 mb-2">{t.registerTitle}</h2>
              <p className="text-slate-500 mb-6">{t.registerSubtitle}</p>
              
              {registerSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-600">
                    <div>{t.registerSuccess}</div>
                  </div>
                </div>
              )}
              
              {registerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-600">
                    <div className="font-medium">{t.registerFailed}</div>
                    <div>{registerError}</div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.nameLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input 
                    type="text" 
                    placeholder={t.namePlaceholder}
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.emailLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input 
                    type="email" 
                    placeholder={t.emailPlaceholder}
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.phoneLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input 
                    type="tel" 
                    placeholder={t.phonePlaceholder}
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.passwordLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input 
                    type="password" 
                    placeholder={t.passwordPlaceholder}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.confirmPasswordLabel}</label>
                <div className="border-b-2 border-slate-100 focus-within:border-black transition-colors py-2">
                  <input 
                    type="password" 
                    placeholder={t.confirmPasswordPlaceholder}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="flex-1 outline-none text-lg bg-transparent placeholder-slate-400 text-slate-900"
                  />
                </div>
              </div>

              <button 
                className="w-full bg-black text-white rounded-full py-4 font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRegister}
                disabled={registerLoading || !registerData.email || !registerData.password || !registerData.confirmPassword}
              >
                {registerLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t.register
                )}
              </button>

              <div className="text-center mt-4">
                <button 
                  onClick={() => {
                    setShowRegister(false);
                    setRegisterError('');
                    setRegisterSuccess(false);
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {t.backToLogin}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
