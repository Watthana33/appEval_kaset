import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { verifyAdminLogin } from '../services/dataService';

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // ค่าเริ่มต้น: ติ๊กจดจำไว้เสมอ เพื่อความสะดวกของผู้บริหาร
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // โหลดชื่อผู้ใช้ที่เคยจำไว้ (ถ้ามี) เพื่อไม่ต้องพิมพ์ใหม่
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem('eval_remembered_username');
      if (savedUser) {
        setUsername(savedUser);
      }
    } catch {
      // ignore
    }
  }, []);

  // 💡 ปรับค่าตรงนี้: เปลี่ยนเป็น false หากต้องการปิด/ซ่อนกล่องแนะนำรหัสผ่านทดสอบ
  const SHOW_DEMO_CREDENTIALS = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await verifyAdminLogin(username.trim(), password);
      if (user) {
        if (rememberMe) {
          // จดจำถาวรในอุปกรณ์นี้ (Persistent LocalStorage)
          localStorage.setItem('eval_current_admin', JSON.stringify(user));
          localStorage.setItem('eval_remembered_username', username.trim());
          sessionStorage.removeItem('eval_current_admin');
        } else {
          // ไม่จดจำ ปิดแท็บ/ปิดเบราว์เซอร์แล้วจะล็อกเอาต์ทันที (SessionStorage)
          sessionStorage.setItem('eval_current_admin', JSON.stringify(user));
          localStorage.removeItem('eval_current_admin');
          localStorage.removeItem('eval_remembered_username');
        }
        onLoginSuccess(user);
        navigate('/dashboard');
      } else {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-emerald-100 dark:border-slate-800 animate-fadeIn transition-colors">
        
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-3">
            <img
              src="/logo_1.png"
              alt="ตราสัญลักษณ์วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-wide uppercase">
            วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">เข้าสู่ระบบการจัดการ</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            สำหรับผู้บริหาร (ดูรายงาน) และผู้ดูแลระบบ (จัดการข้อมูล)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="ป้อนชื่อผู้ใช้ เช่น director หรือ admin"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="ป้อนรหัสผ่าน"
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* เช็คบ็อกซ์: จดจำการเข้าสู่ระบบในอุปกรณ์นี้ (Remember Me) */}
          <div className="flex items-center justify-between pt-0.5 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 transition-all"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                จดจำการเข้าสู่ระบบในอุปกรณ์นี้
              </span>
            </label>
            {/* <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
              
            </span> */}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {SHOW_DEMO_CREDENTIALS && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>สิทธิ์การเข้าใช้งาน 2 ระดับ:</span>
              </p>
              <p>
                • <strong>ผู้บริหาร (ดูผลอย่างเดียว):</strong> Username: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-slate-700 font-mono text-emerald-800 dark:text-emerald-300">director</code> / รหัส: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-slate-700 font-mono text-emerald-800 dark:text-emerald-300">director1234</code>
              </p>
              <p>
                • <strong>แอดมิน (สิทธิสูงสุด):</strong> Username: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-slate-700 font-mono text-emerald-800 dark:text-emerald-300">admin</code> / รหัส: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-slate-700 font-mono text-emerald-800 dark:text-emerald-300">admin1234</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 shadow-emerald-700/20"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </main>
  );
};
