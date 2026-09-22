import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Evaluator } from './components/Evaluator';
import { Dashboard } from './components/Dashboard';
import { AdminConfig } from './components/AdminConfig';
import { AdminLogin } from './components/AdminLogin';
import { TeacherManagement } from './components/TeacherManagement';
import { UserManagement } from './components/UserManagement';
import { AcademicPeriodManagement } from './components/AcademicPeriodManagement';
import { AdminUser } from './types/index';

// Component ตรวจสอบหน้า Home: หากเปิด / โดยมี ?teacher_id ให้ไปหน้าประเมิน แต่ถ้าไม่มีและเป็นแอดมิน ให้ไป dashboard
const HomeRoute: React.FC<{ currentAdmin: AdminUser | null }> = ({ currentAdmin }) => {
  const [searchParams] = useSearchParams();
  const hasTeacherId = Boolean(searchParams.get('teacher_id'));

  if (hasTeacherId) {
    return <Evaluator />;
  }

  if (currentAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Evaluator />;
};

export const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // ตรวจสอบการเข้าสู่ระบบแบบทันที (Synchronous Lazy Init) เพื่อไม่ให้มีอาการกระพริบของหน้าจอ
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    try {
      const savedLocal = localStorage.getItem('eval_current_admin');
      const savedSession = sessionStorage.getItem('eval_current_admin');
      const saved = savedLocal || savedSession;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    // ล้างทั้ง LocalStorage และ SessionStorage เมื่อผู้ใช้กดออกจากระบบจริง
    localStorage.removeItem('eval_current_admin');
    sessionStorage.removeItem('eval_current_admin');
    setCurrentAdmin(null);
    navigate('/admin-login');
  };

  const isDirector = currentAdmin?.role === 'director';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#932D16] selection:text-white transition-colors duration-200 font-sans">
      
      {/* Top Navigation Bar */}
      <Navbar currentAdmin={currentAdmin} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1">
        <Routes>
          {/* 1. ลิงก์ประเมินสำหรับนักเรียน (Dedicated Evaluation Routes - ใช้ได้เสมอ 100%) */}
          <Route path="/evaluate" element={<Evaluator />} />
          <Route path="/eval" element={<Evaluator />} />

          {/* 2. Route หน้าแรก / */}
          <Route path="/" element={<HomeRoute currentAdmin={currentAdmin} />} />

          {/* 3. ล็อกอินสำหรับผู้บริหารและแอดมิน */}
          <Route
            path="/admin-login"
            element={
              currentAdmin ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AdminLogin onLoginSuccess={(u) => setCurrentAdmin(u)} />
              )
            }
          />

          {/* 4. หน้า Dashboard */}
          <Route
            path="/dashboard"
            element={
              currentAdmin ? <Dashboard /> : <Navigate to="/admin-login" replace />
            }
          />

          {/* 5. หน้าจัดการปีการศึกษา & ภาคเรียน (เฉพาะแอดมิน) */}
          <Route
            path="/academic-periods"
            element={
              !currentAdmin ? (
                <Navigate to="/admin-login" replace />
              ) : isDirector ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AcademicPeriodManagement />
              )
            }
          />

          {/* 6. หน้าจัดการข้อมูลครู 150 ท่าน (เฉพาะแอดมิน) */}
          <Route
            path="/teachers"
            element={
              !currentAdmin ? (
                <Navigate to="/admin-login" replace />
              ) : isDirector ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <TeacherManagement />
              )
            }
          />

          {/* 6. หน้าจัดการคำถาม (เฉพาะแอดมิน) */}
          <Route
            path="/admin-config"
            element={
              !currentAdmin ? (
                <Navigate to="/admin-login" replace />
              ) : isDirector ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AdminConfig />
              )
            }
          />

          {/* 7. หน้าจัดการบัญชีผู้ใช้ (เฉพาะแอดมิน) */}
          <Route
            path="/admin-users"
            element={
              !currentAdmin ? (
                <Navigate to="/admin-login" replace />
              ) : isDirector ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <UserManagement />
              )
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to={currentAdmin ? "/dashboard" : "/evaluate"} replace />}
          />
        </Routes>
      </div>

      {/* Footer สีแดงอาชีวะ (#932D16) ตามอัตลักษณ์ สอศ. */}
      <footer className="bg-[#932D16] text-white border-t-4 border-[#7A2411] py-8 text-center text-xs shadow-xl transition-colors">
        <div className="max-w-4xl mx-auto px-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <img 
              src="/logo_1.png" 
              alt="ตราสัญลักษณ์วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม" 
              className="w-10 h-10 object-contain drop-shadow-md brightness-105"
            />
            <div className="text-center sm:text-left">
              <p className="font-extrabold text-white text-base tracking-tight leading-tight">
                วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม
              </p>
              <p className="text-red-100/90 text-xs sm:text-sm font-medium mt-0.5">
                สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) กระทรวงศึกษาธิการ
              </p>
            </div>
          </div>
          <div className="h-px w-36 mx-auto bg-red-400/30 my-2" />
          <p className="text-red-200/80 text-xs font-medium">
            Teacher Evaluation & Quality Analytics Platform • มาตรฐานการประเมินอาชีวศึกษา
          </p>
          <p className="text-red-300/60 text-[11px]">
            ระบบประเมินประสิทธิภาพการจัดการเรียนการสอนครูผู้สอนเพื่อการพัฒนาคุณภาพการศึกษาอย่างยั่งยืน
          </p>
        </div>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
