import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings2, 
  Users, 
  ShieldCheck, 
  Menu, 
  X, 
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AdminUser } from '../types/index';

interface NavbarProps {
  currentAdmin: AdminUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentAdmin, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();

  const isDirector = currentAdmin?.role === 'director';

  // รายการเมนูระบบ
  const navItems = isDirector
    ? [
        { name: 'แดชบอร์ดสรุปผล (Looker Studio)', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      ]
    : [
        { name: 'แดชบอร์ดสรุปผล (Looker Studio)', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'จัดการปีการศึกษา & ภาคเรียน', path: '/academic-periods', icon: <Calendar className="w-5 h-5" /> },
        { name: 'จัดการข้อมูลครูผู้สอน', path: '/teachers', icon: <Users className="w-5 h-5" /> },
        { name: 'ตั้งค่าแบบประเมิน (คำถาม/ชั้น/สาขา)', path: '/admin-config', icon: <Settings2 className="w-5 h-5" /> },
        { name: 'จัดการบัญชีผู้ใช้งาน', path: '/admin-users', icon: <ShieldCheck className="w-5 h-5" /> },
      ];

  // 1. Navbar สำหรับหน้านักเรียน (เมื่อไม่ได้ล็อกอิน)
  if (!currentAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-[#932D16] text-white shadow-lg border-b border-[#7A2411] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* โลโก้วิทยาลัยทางการ logo_1.png */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo_1.png" 
                alt="ตราสัญลักษณ์วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม" 
                className="w-10 h-10 object-contain drop-shadow-md shrink-0 brightness-105" 
              />
              <div>
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight block drop-shadow-sm">
                  วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม
                </span>
                <span className="text-[11px] text-red-100 font-medium block -mt-0.5">
                  ระบบประเมินประสิทธิภาพการจัดการเรียนการสอน
                </span>
              </div>
            </div>

            {/* ขวามือ: ปุ่มเปลี่ยนโหมด มืด/สว่าง */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-black/20 hover:bg-black/30 border border-white/20 transition-all shadow-sm"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-red-100" />}
                <span className="hidden sm:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>

          </div>
        </div>
      </header>
    );
  }

  // 2. Navbar & Side Drawer สำหรับผู้บริหารและแอดมิน (Looker Studio / Executive Analytics)
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#932D16] text-white shadow-lg border-b border-[#7A2411] transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* ซ้าย: ปุ่มแฮมเบอร์เกอร์ + ตราวิทยาลัย + ชื่อวิทยาลัยเต็ม */}
            <div className="flex items-center gap-3">
              {/* ปุ่มแฮมเบอร์เกอร์เปิดเมนูด้านข้าง (Hamburger Menu Button) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs border border-white/20 shadow-sm transition-all active:scale-95"
                title="เปิดเมนูระบบ"
              >
                <Menu className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">เมนูระบบ</span>
              </button>

              {/* โลโก้ทางการ logo_1.png */}
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <img 
                  src="/logo_1.png" 
                  alt="ตราสัญลักษณ์วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม" 
                  className="w-10 h-10 object-contain drop-shadow-md shrink-0 group-hover:scale-105 transition-transform brightness-105" 
                />
                <div>
                  <span className="font-extrabold text-sm sm:text-base text-white tracking-tight block drop-shadow-sm">
                    วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม
                  </span>
                  <span className="text-[11px] text-amber-200 font-semibold hidden sm:block -mt-0.5">
                    Executive & Administration Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* ขวา: Dark/Light Mode, ดูหน้าประเมิน, ข้อมูลผู้ใช้ และปุ่มออกจากระบบที่เด่นชัด */}
            <div className="flex items-center gap-2.5">
              
              {/* Dark Mode / Light Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-black/20 hover:bg-black/30 border border-white/20 transition-all shadow-sm"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden md:inline">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-red-100" />
                    <span className="hidden md:inline">Dark Mode</span>
                  </>
                )}
              </button>

              {/* ปุ่มดูหน้าประเมิน (Preview Link) - แสดงเฉพาะแอดมิน ไม่แสดงให้ผู้บริหารเห็น */}
              {!isDirector && (
                <Link
                  to="/evaluate?teacher_id=t1"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-black/20 hover:bg-black/30 border border-white/20 transition-colors"
                  title="เปิดดูหน้าประเมินของนักเรียน (แท็บใหม่)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  <span>ดูหน้าประเมิน</span>
                </Link>
              )}

              {/* บัญชีผู้ใช้ */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-red-900/50">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 font-extrabold text-xs flex items-center justify-center shadow-md">
                  {currentAdmin.name ? currentAdmin.name.charAt(0) : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-white leading-tight truncate max-w-[140px] drop-shadow-sm">
                    {currentAdmin.name}
                  </p>
                  <p className="text-[10px] text-amber-200 font-bold">
                    {isDirector ? 'ผู้บริหาร (Director)' : 'แอดมิน (Superadmin)'}
                  </p>
                </div>
              </div>

              {/* ปุ่มออกจากระบบ (เด่นชัด สไตล์สีแดงอาชีวะ คมชัด อ่านง่าย 100%) */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-red-100 hover:text-white text-xs font-bold border border-white/20 shadow-sm transition-all active:scale-95 ml-1"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4 text-amber-300" />
                <span>ออกจากระบบ</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* 3. แผงเมนูด้านข้างแบบแฮมเบอร์เกอร์ (Slide-out Sidebar Drawer) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop Overlay มืดเบลอ (คลิกข้างนอกเพื่อปิด) */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* แผง Sidebar ด้านข้าง */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 z-50 animate-slideRight">
            
            <div>
              {/* Header ด้านบนของเมนูแถบข้าง */}
              <div className="bg-[#932D16] -mx-6 -mt-6 p-5 text-white mb-4 rounded-tr-none shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/logo_1.png" 
                      alt="โลโก้" 
                      className="w-10 h-10 object-contain drop-shadow-md shrink-0 brightness-105" 
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-white leading-tight">
                        เมนูจัดการระบบ
                      </h3>
                      <p className="text-[11px] text-amber-200 font-semibold">
                        วษท.มหาสารคาม
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-black/20 transition-colors"
                    title="ปิดเมนู"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* การ์ดข้อมูลผู้ใช้งาน */}
              <div className="my-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#932D16] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-sm">
                  {currentAdmin.name ? currentAdmin.name.charAt(0) : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentAdmin.name}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-900/80 text-[#932D16] dark:text-red-200">
                    {isDirector ? 'สิทธิ์: ผู้บริหาร (Director)' : 'สิทธิ์: ผู้ดูแลระบบหลัก (Superadmin)'}
                  </span>
                </div>
              </div>

              {/* รายการเมนูระบบ (จัดวางแนวตั้ง กว้างขวาง บรรทัดเดียว ไม่บีบอัด) */}
              <nav className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-1">
                  ส่วนการทำงาน
                </p>

                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? 'bg-[#932D16] text-white shadow-md shadow-[#932D16]/25'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-red-50/60 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={active ? 'text-white' : 'text-[#932D16] dark:text-red-400'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* เมนูเปิดดูหน้าประเมินนักเรียน (แสดงเฉพาะแอดมิน ไม่แสดงให้ผู้บริหารเห็น) */}
                {!isDirector && (
                  <Link
                    to="/evaluate?teacher_id=t1"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-slate-500" />
                    <span>เปิดดูหน้าประเมินนักเรียน</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* ส่วนล่างของ Sidebar: Dark Mode & ออกจากระบบ */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>ธีมหน้าจอ</span>
                </span>
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
