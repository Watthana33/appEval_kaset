import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Tag,
  ListOrdered,
  Sprout,
  GraduationCap,
  BookOpen,
  Layers,
  Building2,
  Sparkles
} from 'lucide-react';
import { 
  getSurveyQuestions, 
  addSurveyQuestion, 
  updateSurveyQuestion, 
  deleteSurveyQuestion,
  getSurveyCategories,
  addSurveyCategory,
  updateSurveyCategory,
  deleteSurveyCategory,
  getEducationLevels,
  addEducationLevel,
  deleteEducationLevel,
  getMajors,
  addMajor,
  deleteMajor,
  getDepartments,
  addDepartment,
  deleteDepartment
} from '../services/dataService';
import { SurveyQuestion, SurveyCategory, EducationLevel, Major, Department, QuestionType } from '../types/index';

type ConfigTab = 'questions' | 'categories' | 'levels' | 'departments' | 'majors';

export const AdminConfig: React.FC = () => {
  // Tabs: 'questions' | 'categories' | 'levels' | 'departments' | 'majors'
  const [activeTab, setActiveTab] = useState<ConfigTab>('questions');

  // Ref สำหรับเลื่อนหน้าจอไปยังแบบฟอร์มคำถามเมื่อกดแก้ไข
  const questionFormRef = useRef<HTMLDivElement>(null);

  // Question States
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Form State for Adding / Editing Question
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newOrderNo, setNewOrderNo] = useState<number>(1);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('rating');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Category States
  const [categories, setCategories] = useState<SurveyCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState<string>('');

  // Education Level States
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [newLevelName, setNewLevelName] = useState<string>('');

  // Department States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDeptName, setNewDeptName] = useState<string>('');

  // Major States
  const [majors, setMajors] = useState<Major[]>([]);
  const [newMajorName, setNewMajorName] = useState<string>('');
  const [newMajorDept, setNewMajorDept] = useState<string>('');

  // Notification Toast State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [questionsData, categoriesData, levelsData, deptsData, majorsData] = await Promise.all([
        getSurveyQuestions(),
        getSurveyCategories(),
        getEducationLevels(),
        getDepartments(),
        getMajors(),
      ]);
      setQuestions(questionsData);
      setCategories(categoriesData);
      setLevels(levelsData);
      setDepartments(deptsData);
      setMajors(majorsData);
      setNewOrderNo((questionsData.length || 0) + 1);
      if (categoriesData.length > 0) {
        setNewCategory(categoriesData[0].name);
      }
      if (deptsData.length > 0 && !newMajorDept) {
        setNewMajorDept(deptsData[0].name);
      }
    } catch (err) {
      console.error('Failed to load configuration data:', err);
      showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- Questions Handlers ---
  const handleSaveQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      showNotification('กรุณาระบุข้อความคำถาม', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const defaultCat = categories[0]?.name || 'ด้านผู้สอน';
      const categoryToSave = newCategory.trim() || defaultCat;

      if (editingQuestionId) {
        // Mode: แก้ไขคำถามเดิม
        const updated = await updateSurveyQuestion(editingQuestionId, {
          question_text: newQuestionText.trim(),
          category: categoryToSave,
          order_no: Number(newOrderNo) || 1,
          question_type: newQuestionType,
        });

        if (updated) {
          setQuestions((prev) =>
            prev.map((q) => (q.id === editingQuestionId ? updated : q))
          );
          setEditingQuestionId(null);
          setNewQuestionText('');
          setNewCategory(defaultCat);
          setNewQuestionType('rating');
          setNewOrderNo(questions.length + 1);
          showNotification('บันทึกการแก้ไขข้อคำถามสำเร็จ');
        }
      } else {
        // Mode: เพิ่มคำถามใหม่
        const added = await addSurveyQuestion({
          question_text: newQuestionText.trim(),
          category: categoryToSave,
          order_no: Number(newOrderNo) || questions.length + 1,
          question_type: newQuestionType,
        });

        setQuestions((prev) => [...prev, added]);
        setNewQuestionText('');
        setNewCategory(categoryToSave);
        setNewQuestionType('rating');
        setNewOrderNo(questions.length + 2);
        showNotification('เพิ่มข้อคำถามใหม่ลงในแบบประเมินเรียบร้อยแล้ว');
      }
    } catch (err) {
      console.error('Failed to save survey question:', err);
      showNotification('เกิดข้อผิดพลาดในการบันทึกคำถาม กรุณาลองใหม่', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEditQuestion = (q: SurveyQuestion) => {
    setEditingQuestionId(q.id);
    setNewQuestionText(q.question_text);
    setNewCategory(q.category);
    setNewQuestionType(q.question_type || 'rating');
    setNewOrderNo(q.order_no || 1);
    questionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId(null);
    setNewQuestionText('');
    setNewCategory(categories[0]?.name || '');
    setNewQuestionType('rating');
    setNewOrderNo(questions.length + 1);
  };

  const handleDeleteQuestion = async (id: string, text: string) => {
    const confirm = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม:\n"${text}" ?`);
    if (!confirm) return;

    setActionLoading(true);
    try {
      await deleteSurveyQuestion(id);
      setQuestions((prev) => {
        const remaining = prev.filter((q) => q.id !== id);
        if (!editingQuestionId) {
          setNewOrderNo(remaining.length + 1);
        }
        return remaining;
      });
      if (editingQuestionId === id) {
        handleCancelQuestionEdit();
      }
      showNotification('ลบข้อคำถามออกจากระบบแล้ว');
    } catch (err) {
      console.error('Failed to delete question:', err);
      showNotification('เกิดข้อผิดพลาดในการลบคำถาม', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Categories Handlers ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showNotification('กรุณาระบุชื่อด้านการประเมิน', 'error');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showNotification(`ด้าน "${trimmed}" มีอยู่ในระบบแล้ว`, 'error');
      return;
    }

    setActionLoading(true);
    try {
      const added = await addSurveyCategory(trimmed);
      setCategories((prev) => [...prev, added]);
      setNewCategoryName('');
      if (!newCategory) {
        setNewCategory(added.name);
      }
      showNotification(`เพิ่มด้านการประเมิน "${added.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to add category:', err);
      showNotification('เกิดข้อผิดพลาดในการเพิ่มด้านการประเมิน', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEditCategory = (cat: SurveyCategory) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
  };

  const handleSaveEditCategory = async (id: string, oldName: string) => {
    const trimmed = editCategoryName.trim();
    if (!trimmed) {
      showNotification('กรุณาระบุชื่อด้านการประเมิน', 'error');
      return;
    }
    if (trimmed === oldName) {
      setEditingCategoryId(null);
      return;
    }

    setActionLoading(true);
    try {
      const updated = await updateSurveyCategory(id, trimmed, oldName);
      if (updated) {
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        // อัปเดต state คำถามด้วย หากคำถามมีด้านเป็นชื่อเดิม
        setQuestions((prev) =>
          prev.map((q) => (q.category === oldName ? { ...q, category: trimmed } : q))
        );
        if (newCategory === oldName) {
          setNewCategory(trimmed);
        }
        setEditingCategoryId(null);
        setEditCategoryName('');
        showNotification(`อัปเดตชื่อด้านการประเมินและข้อคำถามที่เกี่ยวข้องเรียบร้อยแล้ว`);
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      showNotification('เกิดข้อผิดพลาดในการแก้ไขชื่อด้าน', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const relatedQuestionsCount = questions.filter((q) => q.category === name).length;
    let message = `คุณต้องการลบด้านการประเมิน "${name}" ใช่หรือไม่?`;
    if (relatedQuestionsCount > 0) {
      message = `คำเตือน: มีข้อคำถามที่อยู่ในด้าน "${name}" จำนวน ${relatedQuestionsCount} ข้อ\nหากลบด้านนี้ ข้อคำถามเหล่านั้นจะยังคงอยู่แต่ด้านจะถูกลบ\nคุณต้องการลบด้าน "${name}" ใช่หรือไม่?`;
    }

    const confirm = window.confirm(message);
    if (!confirm) return;

    setActionLoading(true);
    try {
      await deleteSurveyCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showNotification(`ลบด้านการประเมิน "${name}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to delete category:', err);
      showNotification('เกิดข้อผิดพลาดในการลบด้านการประเมิน', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Education Levels Handlers ---
  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelName.trim()) {
      showNotification('กรุณาระบุชื่อระดับชั้น เช่น ปวช.1', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const added = await addEducationLevel(newLevelName.trim());
      setLevels((prev) => [...prev, added]);
      setNewLevelName('');
      showNotification(`เพิ่มระดับชั้น "${added.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to add level:', err);
      showNotification('เกิดข้อผิดพลาดในการเพิ่มระดับชั้น', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLevel = async (id: string, name: string) => {
    const confirm = window.confirm(`คุณต้องการลบระดับชั้น "${name}" ใช่หรือไม่?`);
    if (!confirm) return;

    setActionLoading(true);
    try {
      await deleteEducationLevel(id);
      setLevels((prev) => prev.filter((l) => l.id !== id));
      showNotification(`ลบระดับชั้น "${name}" ออกแล้ว`);
    } catch (err) {
      console.error('Failed to delete level:', err);
      showNotification('เกิดข้อผิดพลาดในการลบระดับชั้น', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Departments Handlers ---
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      showNotification('กรุณาระบุชื่อแผนกวิชา เช่น แผนกวิชาพืชศาสตร์', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const added = await addDepartment(newDeptName.trim());
      setDepartments((prev) => [...prev, added]);
      setNewDeptName('');
      if (!newMajorDept) setNewMajorDept(added.name);
      showNotification(`เพิ่มแผนกวิชา "${added.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to add department:', err);
      showNotification('เกิดข้อผิดพลาดในการเพิ่มแผนกวิชา', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    const confirm = window.confirm(`คุณต้องการลบแผนกวิชา "${name}" ใช่หรือไม่?`);
    if (!confirm) return;

    setActionLoading(true);
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      showNotification(`ลบแผนกวิชา "${name}" ออกแล้ว`);
    } catch (err) {
      console.error('Failed to delete department:', err);
      showNotification('เกิดข้อผิดพลาดในการลบแผนกวิชา', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Majors Handlers ---
  const handleAddMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajorName.trim()) {
      showNotification('กรุณาระบุชื่อสาขาวิชา เช่น สาขาวิชาพืชศาสตร์', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const deptToUse = newMajorDept.trim() || (departments.length > 0 ? departments[0].name : 'แผนกวิชาทั่วไป');
      const added = await addMajor(newMajorName.trim(), deptToUse);
      setMajors((prev) => [...prev, added]);
      setNewMajorName('');
      showNotification(`เพิ่มสาขาวิชา "${added.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to add major:', err);
      showNotification('เกิดข้อผิดพลาดในการเพิ่มสาขาวิชา', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMajor = async (id: string, name: string) => {
    const confirm = window.confirm(`คุณต้องการลบสาขาวิชา "${name}" ใช่หรือไม่?`);
    if (!confirm) return;

    setActionLoading(true);
    try {
      await deleteMajor(id);
      setMajors((prev) => prev.filter((m) => m.id !== id));
      showNotification(`ลบสาขาวิชา "${name}" ออกแล้ว`);
    } catch (err) {
      console.error('Failed to delete major:', err);
      showNotification('เกิดข้อผิดพลาดในการลบสาขาวิชา', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast แจ้งเตือน */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-slideUp ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Card (พร้อมเงาและ Hover Bounce) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4" />
            <span>Survey Configuration Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            จัดการข้อมูล & ข้อคำถามแบบประเมิน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม • ตั้งค่าคำถาม, ระดับชั้นเรียน, แผนกวิชา และสาขาวิชา
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </section>

      {/* Tab Navigation (5 Tabs: คำถาม, ด้านการประเมิน, ระดับชั้น, แผนกวิชา, สาขาวิชา) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-3xl shadow-inner border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">ข้อคำถาม ({questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 shrink-0" />
          <span className="truncate">ด้านการประเมิน ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('levels')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'levels'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="truncate">ระดับชั้น ({levels.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="truncate">แผนกวิชา ({departments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('majors')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'majors'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">สาขาวิชา ({majors.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: จัดการข้อคำถามแบบประเมิน                           */}
      {/* ======================================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Form เพิ่ม/แก้ไขคำถาม */}
          <section
            ref={questionFormRef}
            className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all duration-300 shadow-md ${
              editingQuestionId
                ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30 shadow-amber-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingQuestionId ? (
                  <>
                    <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      <Edit3 className="w-4 h-4" />
                    </span>
                    <span>แก้ไขข้อคำถามประเมิน (กำลังแก้ไขข้อที่ {newOrderNo})</span>
                  </>
                ) : (
                  <>
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      <Plus className="w-4 h-4" />
                    </span>
                    <span>เพิ่มข้อคำถามประเมินใหม่</span>
                  </>
                )}
              </h2>

              {editingQuestionId && (
                <button
                  type="button"
                  onClick={handleCancelQuestionEdit}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> ยกเลิกการแก้ไข
                </button>
              )}
            </div>

            <form onSubmit={handleSaveQuestionForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ข้อความคำถามประเมิน (Question Text)
                </label>
                <input
                  type="text"
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="เช่น อาจารย์มีวิธีการถ่ายทอดเนื้อหาที่เป็นขั้นเป็นตอนและเข้าใจง่าย"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      ด้านการประเมิน (Category)
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('categories')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      จัดการ/เพิ่มด้านใหม่ &rarr;
                    </button>
                  </div>
                  <select
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white cursor-pointer"
                  >
                    {categories.length === 0 ? (
                      <option value="">-- ยังไม่มีด้านการประเมิน (คลิกจัดการ/เพิ่มด้านใหม่) --</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">เลือกด้านการประเมินจากรายการที่กำหนดไว้ในระบบ</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    รูปแบบคำถาม
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setNewQuestionType('rating')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        newQuestionType === 'rating'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>คะแนน 1-5</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuestionType('text')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        newQuestionType === 'text'
                          ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>แบบเขียนตอบ</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {newQuestionType === 'rating' ? 'ให้เลือกคะแนน 1 ถึง 5' : 'ช่องพิมพ์ข้อความ/ความเห็น'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
                    ลำดับข้อ (Order No)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newOrderNo}
                    onChange={(e) => setNewOrderNo(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">ใช้จัดเรียงข้อคำถาม</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={handleCancelQuestionEdit}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                  >
                    ยกเลิก
                  </button>
                )}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                    editingQuestionId
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {editingQuestionId ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>บันทึกการแก้ไขข้อคำถาม</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>บันทึกข้อคำถามใหม่</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ตารางรายการข้อคำถาม */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  รายการข้อคำถามทั้งหมด ({questions.length} ข้อ)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  คำถามที่เปิดใช้งานอยู่ในแบบประเมินปัจจุบัน (คลิกปุ่มดินสอ ✏️ เพื่อแก้ไขข้อความหรือเปลี่ยนด้าน)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-4">ข้อความคำถาม</th>
                    <th className="py-3 px-4 w-52">ด้านการประเมิน (หมวดหมู่)</th>
                    <th className="py-3 px-4 w-32 text-center">รูปแบบคำถาม</th>
                    <th className="py-3 px-4 w-28 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {questions.length > 0 ? (
                    questions
                      .sort((a, b) => (a.order_no || 0) - (b.order_no || 0))
                      .map((q) => {
                        const isCurrentEditing = editingQuestionId === q.id;

                        return (
                          <tr
                            key={q.id}
                            className={`transition-colors ${
                              isCurrentEditing
                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-l-amber-500'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-mono">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {q.order_no || '-'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {q.question_text}
                              </span>
                              {isCurrentEditing && (
                                <span className="ml-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
                                  กำลังแก้ไขที่ฟอร์มด้านบน
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium text-[11px]">
                                {q.category}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {q.question_type === 'text' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium text-[11px]">
                                  <Edit3 className="w-3 h-3" />
                                  แบบเขียนตอบ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  คะแนน 1-5
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleStartEditQuestion(q)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isCurrentEditing
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400'
                                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
                                  }`}
                                  title="แก้ไขข้อคำถาม (เปิดแบบฟอร์มด้านบน)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id, q.question_text)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="ลบคำถาม"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        ยังไม่มีข้อคำถามในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: จัดการด้านการประเมิน (Survey Categories)             */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Form เพิ่มด้านการประเมิน */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              เพิ่มด้านการประเมินใหม่
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              กำหนดด้าน/มิติการประเมินสำหรับการประเมินการสอน เช่น ด้านผู้สอน, ด้านการสอนและการถ่ายทอดความรู้ (เมื่อแก้ไขชื่อด้าน ระบบจะอัปเดตคำถามที่อยู่ในด้านนั้นให้อัตโนมัติ)
            </p>

            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="ระบุชื่อด้านการประเมิน เช่น ด้านการสอนและการถ่ายทอดความรู้"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มด้านการประเมิน</span>
              </button>
            </form>
          </section>

          {/* รายการด้านการประเมิน */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>ด้านการประเมินทั้งหมดในระบบ ({categories.length} ด้าน)</span>
              </div>
            </h3>

            {categories.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                ยังไม่มีด้านการประเมินในระบบ กรุณากรอกแบบฟอร์มด้านบนเพื่อเพิ่มด้านแรก
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((cat, idx) => {
                  const isEditing = editingCategoryId === cat.id;
                  const questionCount = questions.filter((q) => q.category === cat.name).length;

                  return (
                    <div
                      key={cat.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 ${
                        isEditing
                          ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-emerald-400 rounded-lg text-xs dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditCategory(cat.id, cat.name);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                              {questionCount} คำถาม
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(cat.id, cat.name)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="บันทึกการแก้ไขชื่อ"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditCategoryName('');
                              }}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                              title="ยกเลิก"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditCategory(cat)}
                              className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={`แก้ไขชื่อ ${cat.name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title={`ลบด้านการประเมิน ${cat.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: จัดการระดับชั้นเรียน (Education Levels)               */}
      {/* ======================================================== */}
      {activeTab === 'levels' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Form เพิ่มระดับชั้น */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              เพิ่มระดับชั้นเรียนใหม่
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              กำหนดระดับชั้นเรียนที่เปิดให้ผู้เรียนเลือก เช่น ปวช.1, ปวช.2, ปวช.3, ปวส.1, ปวส.2, ปริญญาตรี
            </p>

            <form onSubmit={handleAddLevel} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                required
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="ระบุชื่อระดับชั้น เช่น ปวช.1 หรือ ปริญญาตรี"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มระดับชั้น</span>
              </button>
            </form>
          </section>

          {/* รายการระดับชั้นเรียน */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>ระดับชั้นเรียนในระบบ ({levels.length} ระดับ)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {levels.map((level, idx) => (
                <div
                  key={level.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {level.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLevel(level.id, level.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title={`ลบระดับชั้น ${level.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: จัดการแผนกวิชา (Departments)                         */}
      {/* ======================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Form เพิ่มแผนกวิชา */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              เพิ่มแผนกวิชาใหม่
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              กำหนดแผนกวิชาหลักของวิทยาลัยฯ เพื่อใช้สังกัดสาขาวิชาและจัดกลุ่มอาจารย์ผู้สอน
            </p>

            <form onSubmit={handleAddDepartment} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                required
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="ระบุชื่อแผนกวิชา เช่น แผนกวิชาการโรงแรม, แผนกวิชาช่างยนต์"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มแผนกวิชา</span>
              </button>
            </form>
          </section>

          {/* รายการแผนกวิชา */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>แผนกวิชาในระบบ ({departments.length} แผนก)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {departments.map((dept, idx) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {dept.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                    title={`ลบแผนกวิชา ${dept.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: จัดการสาขาวิชา (Majors)                              */}
      {/* ======================================================== */}
      {activeTab === 'majors' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Form เพิ่มสาขาวิชา */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              เพิ่มสาขาวิชาใหม่
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              สาขาวิชานี้จะแสดงในดรอปดาวน์ให้นักเรียนเลือกในแบบประเมิน
            </p>

            <form onSubmit={handleAddMajor} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={newMajorName}
                  onChange={(e) => setNewMajorName(e.target.value)}
                  placeholder="ระบุชื่อสาขาวิชา เช่น สาขาวิชาพืชศาสตร์, สาขาวิชาสัตวศาสตร์"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={newMajorDept}
                  onChange={(e) => setNewMajorDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))
                  ) : (
                    <option value="แผนกวิชาทั่วไป">แผนกวิชาทั่วไป</option>
                  )}
                </select>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มสาขา</span>
                </button>
              </div>
            </form>
          </section>

          {/* รายการสาขาวิชา */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>สาขาวิชาทั้งหมดในระบบ ({majors.length} สาขา)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {majors.map((major, idx) => (
                <div
                  key={major.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {major.name}
                      </h4>
                    </div>
                    {major.department && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-7 truncate">
                        {major.department}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMajor(major.id, major.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                    title={`ลบสาขาวิชา ${major.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

    </main>
  );
};
