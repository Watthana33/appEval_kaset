import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  UserCheck, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  Calendar, 
  HeartHandshake,
  AlertTriangle,
  Sprout,
  ArrowLeft,
  Info,
  Check,
  ShieldCheck,
  ZoomIn,
  X,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { 
  getTeachers, 
  getSurveyQuestions, 
  saveEvaluationResponse,
  getActiveAcademicPeriod,
  getEducationLevels,
  getMajors
} from '../services/dataService';
import { Teacher, SurveyQuestion, EducationLevel, Major } from '../types/index';

export const Evaluator: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query param ?teacher_id=...
  const teacherIdParam = searchParams.get('teacher_id');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  
  // Settings & Form States (ดึงปีการศึกษาและภาคเรียนที่ Active โดยอัตโนมัติ)
  const [academicYear, setAcademicYear] = useState<string>('2567');
  const [term, setTerm] = useState<string>('1');
  
  // ข้อมูลประชากรศาสตร์ของผู้ตอบแบบประเมิน (Demographics) - ตั้งต้นเป็นค่าว่างเพื่อบังคับให้ผู้เรียนเลือกจริง
  const [gender, setGender] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [major, setMajor] = useState<string>('');

  // รายการตัวเลือกระดับชั้นและสาขาวิชาจากระบบ
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  // คะแนนและข้อเสนอแนะ (แยก 2 หัวข้อตามแบบประเมินทางการของวิทยาลัย)
  const [scores, setScores] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [suggestion, setSuggestion] = useState<string>(''); // ข้อ 3.3 สิ่งที่ต้องการให้ปรับปรุงหรือจัดกิจกรรมเพิ่มเติม
  const [impression, setImpression] = useState<string>(''); // ข้อ 3.4 ความประทับใจที่มีต่ออาจารย์ผู้สอน

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // ตรวจสอบว่ามี admin login ค้างอยู่หรือไม่ เพื่อแสดงแถบพรีวิว
  const isAdminPreview = Boolean(localStorage.getItem('eval_current_admin'));

  // ระดับคะแนน 1-5 แบบ Modern Professional UI (รองรับผู้เรียนทุกช่วงวัย)
  const scoreConfig: Record<number, { label: string; activeClass: string; defaultClass: string; activeText: string }> = {
    1: { 
      label: 'ควรปรับปรุง', 
      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 ring-2 ring-rose-300 dark:ring-rose-800 scale-[1.02]',
      defaultClass: 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-slate-800',
      activeText: 'text-rose-100'
    },
    2: { 
      label: 'พอใช้', 
      activeClass: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-300 dark:ring-amber-800 scale-[1.02]',
      defaultClass: 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-slate-800',
      activeText: 'text-amber-100'
    },
    3: { 
      label: 'ปานกลาง', 
      activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25 ring-2 ring-sky-300 dark:ring-sky-800 scale-[1.02]',
      defaultClass: 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-slate-800',
      activeText: 'text-sky-100'
    },
    4: { 
      label: 'ดี', 
      activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/25 ring-2 ring-teal-300 dark:ring-teal-800 scale-[1.02]',
      defaultClass: 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-teal-50/50 dark:hover:bg-slate-800',
      activeText: 'text-teal-100'
    },
    5: { 
      label: 'ดีเยี่ยม', 
      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-300 dark:ring-emerald-800 scale-[1.02]',
      defaultClass: 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800',
      activeText: 'text-emerald-100'
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teachersData, questionsData, activePeriod, levelsData, majorsData] = await Promise.all([
          getTeachers(),
          getSurveyQuestions(),
          getActiveAcademicPeriod(),
          getEducationLevels(),
          getMajors(),
        ]);

        setTeachers(teachersData);
        setQuestions(questionsData);
        setEducationLevels(levelsData);
        setMajors(majorsData);

        // ไม่เลือกข้อมูลอัตโนมัติ เพื่อบังคับให้ผู้เรียนเป็นผู้เลือกเองจริง ๆ ป้องกันข้อมูลคลาดเคลื่อน

        if (activePeriod) {
          setAcademicYear(activePeriod.academic_year);
          setTerm(activePeriod.term);
        }

        // ค้นหาอาจารย์ตาม query param ?teacher_id=...
        if (teacherIdParam && teachersData.length > 0) {
          const found = teachersData.find((t) => t.id === teacherIdParam);
          if (found) {
            setSelectedTeacher(found);
          } else {
            setSelectedTeacher(teachersData[0]);
          }
        } else if (teachersData.length > 0) {
          setSelectedTeacher(teachersData[0]);
        }
      } catch (err) {
        console.error('Error loading evaluation data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherIdParam]);

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherDropdown(false);
    setScores({});
    setTextAnswers({});
    setSuggestion('');
    setImpression('');
    setFormError('');
    setSearchParams({ teacher_id: teacher.id });
  };

  // เลือกระดับคะแนน (กดซ้ำที่เดิมเพื่อยกเลิกการเลือก - Deselect Toggle)
  const handleSelectScore = (questionId: string, score: number) => {
    setScores((prev) => {
      const next = { ...prev };
      if (next[questionId] === score) {
        delete next[questionId];
      } else {
        next[questionId] = score;
      }
      return next;
    });
    setFormError('');
  };

  // บันทึกคำตอบประเภทแบบเขียนตอบ (Text Answer Change)
  const handleTextAnswerChange = (questionId: string, val: string) => {
    setTextAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
    setFormError('');
  };

  /**
   * ปรับแต่งการแสดงผลลำดับข้อย่อยให้อ้างอิงจากลำดับและหมวดหมู่ เช่น 1.1, 1.2, 2.1, 3.1
   * โดยตัดเลขลำดับเดิมที่ผู้ใช้พิมพ์ไว้ด้านหน้าออกอัตโนมัติ เพื่อป้องกันการแสดงผลซ้ำซ้อน เช่น '1. 1.1'
   */
  const formatQuestionItem = (groupIdx: number, itemIdx: number, rawText: string) => {
    const trimmed = (rawText || '').trim();
    // ตรวจสอบว่าขึ้นต้นด้วยตัวเลข เช่น "1.1", "1.1.", "1.1 -", "1.", "3.1)" หรือไม่
    const prefixMatch = trimmed.match(/^(\d+(\.\d+)+|\d+)\s*[.:\-)–—]?\s*(.*)$/);

    let itemNumber = `${groupIdx + 1}.${itemIdx + 1}`;
    let cleanText = trimmed;

    if (prefixMatch) {
      const parsedNumber = prefixMatch[1];
      const parsedText = prefixMatch[3];

      if (parsedText) {
        cleanText = parsedText;
      }

      // หากข้อความที่กรอกมีเลขลำดับย่อยที่มีจุดอยู่แล้ว (เช่น 1.1, 2.1, 3.1) ให้นำเลขนั้นมาใช้
      if (parsedNumber.includes('.')) {
        itemNumber = parsedNumber;
      }
    }

    return { itemNumber, cleanText };
  };

  const ratingQuestions = questions.filter((q) => q.question_type !== 'text');
  const textQuestions = questions.filter((q) => q.question_type === 'text');
  const hasCustomTextQuestions = textQuestions.length > 0;

  const answeredRatingCount = ratingQuestions.filter((q) => scores[q.id] !== undefined).length;
  const answeredTextCount = textQuestions.filter((q) => (textAnswers[q.id] || '').trim().length > 0).length;
  const totalAnswered = answeredRatingCount + answeredTextCount;
  const progressPercent = questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacher) {
      setFormError('กรุณาเลือกอาจารย์ผู้สอนก่อนทำการประเมิน');
      return;
    }

    if (!gender) {
      setFormError('กรุณาระบุเพศของผู้ตอบแบบประเมิน');
      const el = document.getElementById('demographics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!educationLevel) {
      setFormError('กรุณาเลือกระดับชั้นเรียน');
      const el = document.getElementById('demographics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!major) {
      setFormError('กรุณาเลือกสาขาวิชาที่กำลังศึกษา');
      const el = document.getElementById('demographics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // ตรวจสอบเฉพาะข้อที่เป็นแบบเลือกคะแนน (rating) ว่าตอบครบทุกข้อหรือไม่
    const unAnswered = ratingQuestions.filter((q) => !scores[q.id]);
    if (unAnswered.length > 0) {
      setFormError(`กรุณาให้คะแนนให้ครบทุกข้อ (ยังขาดอีก ${unAnswered.length} ข้อ)`);
      const firstUnansweredEl = document.getElementById(`question-${unAnswered[0].id}`);
      if (firstUnansweredEl) {
        firstUnansweredEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      // คำนวณคะแนนเฉลี่ยเฉพาะข้อที่เป็นแบบคะแนน 1-5 (rating) เท่านั้น ไม่รวมข้อเขียน
      const ratingScores = ratingQuestions.map((q) => scores[q.id]).filter((s) => typeof s === 'number');
      const avg = ratingScores.length > 0
        ? ratingScores.reduce((sum, val) => sum + val, 0) / ratingScores.length
        : 0;

      // รวบรวมข้อความคำตอบแบบเขียน
      let resolvedSuggestion = suggestion.trim();
      let resolvedImpression = impression.trim();
      const customTextEntries: string[] = [];

      questions.forEach((q) => {
        if (q.question_type === 'text') {
          const val = (textAnswers[q.id] || '').trim();
          if (val) {
            customTextEntries.push(`${q.question_text}: ${val}`);
            const lower = q.question_text.toLowerCase();
            if (lower.includes('ปรับปรุง') || lower.includes('กิจกรรม') || lower.includes('3.3')) {
              if (!resolvedSuggestion) resolvedSuggestion = val;
            } else if (lower.includes('ประทับใจ') || lower.includes('3.4')) {
              if (!resolvedImpression) resolvedImpression = val;
            }
          }
        }
      });

      const combined = [
        ...customTextEntries,
        suggestion.trim(),
        impression.trim(),
      ].filter(Boolean).join(' | ');

      await saveEvaluationResponse({
        teacher_id: selectedTeacher.id,
        teacher_name: selectedTeacher.name,
        department: selectedTeacher.department || 'แผนกวิชาทั่วไป',
        academic_year: academicYear,
        term: term,
        gender: gender,
        education_level: educationLevel,
        major: major,
        scores: scores,
        text_answers: textAnswers,
        average_score: parseFloat(avg.toFixed(2)),
        suggestion: resolvedSuggestion,
        impression: resolvedImpression,
        feedback: combined,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saving response:', err);
      setFormError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedQuestions = questions.reduce<Record<string, SurveyQuestion[]>>((acc, q) => {
    const cat = q.category || 'ข้อคำถามทั่วไป';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-base font-bold text-slate-800 dark:text-slate-100">กำลังโหลดแบบประเมินการเรียนการสอน...</p>
        <p className="text-xs text-slate-500 mt-1">วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม</p>
      </div>
    );
  }

  // หน้าจอเมื่อส่งแบบประเมินสำเร็จ
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-scaleUp">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            บันทึกการประเมินเรียบร้อยแล้ว
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            ขอขอบคุณที่ร่วมเป็นส่วนหนึ่งในการประเมินการสอนของ <strong className="text-emerald-700 dark:text-emerald-400">{selectedTeacher?.name}</strong> ข้อมูลของท่านได้รับการคุ้มครองตาม พ.ร.บ. PDPA และจะถูกนำไปพัฒนาคุณภาพการจัดการเรียนการสอนต่อไป
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1 text-left mb-6">
            <div className="flex justify-between">
              <span>อาจารย์ผู้สอน:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTeacher?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>ปีการศึกษา / ภาคเรียน:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{academicYear} / เทอม {term}</span>
            </div>
            <div className="flex justify-between">
              <span>ระดับชั้น / สาขาวิชา:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{educationLevel} • {major}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setScores({});
                setTextAnswers({});
                setSuggestion('');
                setImpression('');
                setShowTeacherDropdown(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all"
            >
              ประเมินอาจารย์ท่านอื่นต่อ
            </button>
            {isAdminPreview && (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors"
              >
                กลับสู่ Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 transition-colors animate-fadeIn">
      
      {/* แถบพรีวิวสำหรับ Admin / Superadmin */}
      {isAdminPreview && (
        <div className="mb-6 p-3 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-center justify-between shadow-sm border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-medium">
              โหมดพรีวิวแบบประเมินนักเรียน (เข้าสู่ระบบในฐานะแอดมิน)
            </span>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่ Dashboard</span>
          </Link>
        </div>
      )}

      {/* Modal ขยายรูปอาจารย์เมื่อแตะหรือคลิก */}
      {showImageModal && selectedTeacher && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-2xl overflow-hidden shadow-xl border-4 border-emerald-500/40 mb-4">
              <img
                src={selectedTeacher.image_url}
                alt={selectedTeacher.name}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedTeacher.name}
            </h3>
            {selectedTeacher.subject && (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {selectedTeacher.subject}
              </p>
            )}
            {selectedTeacher.department && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedTeacher.department}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-4">
              แตะที่ใดก็ได้เพื่อปิดหน้าต่าง
            </p>
          </div>
        </div>
      )}

      {/* ส่วนหัวแบบประเมินทางการ (Official Form Header) อ้างอิงตามรอบการประเมินที่แอดมินเลือก */}
      <header className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200 dark:border-slate-800 mb-6">
        {/* แถบสีด้านบน (Form Theme Accent Bar) */}
        <div className="h-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <img
              src="/logo_1.png"
              alt="ตราวิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm shrink-0"
            />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  แบบประเมินการจัดการเรียนการสอน
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                แบบประเมินความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนการสอนของครูผู้สอน
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm sm:text-base border border-emerald-300 dark:border-emerald-700 shadow-sm">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>ภาคเรียนที่ {term}</span>
                  <span>ปีการศึกษา {academicYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* 1. การ์ดโปรไฟล์อาจารย์ผู้สอน (พร้อมรูปเด้งขยายเมื่อแตะ/ชี้) */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200 dark:border-slate-800 mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* รูปครู: เมื่อเม้าส์ชี้หรือแตะ จะเด้งขยายขึ้นมาเด่นชัด */}
            <div 
              onClick={() => setShowImageModal(true)}
              className="relative shrink-0 group cursor-pointer"
              title="แตะหรือคลิกเพื่อดูรูปภาพขยายใหญ่"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/40 shadow-md group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-110">
                <img
                  src={selectedTeacher?.image_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
                  alt={selectedTeacher?.name || 'รูปอาจารย์'}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white p-1.5 rounded-full shadow-lg group-hover:scale-125 transition-transform">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>แบบประเมินผู้สอน</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {selectedTeacher?.name || 'กรุณาเลือกอาจารย์'}
              </h1>

              {selectedTeacher?.subject && (
                <p className="text-base sm:text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  รายวิชา: {selectedTeacher.subject}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                {selectedTeacher?.department && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    <img src="/logo_1.png" alt="ตราวิทยาลัย" className="w-3.5 h-3.5 object-contain" />
                    <span>{selectedTeacher.department}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>ปีการศึกษา {academicYear} / เทอม {term}</span>
                </span>
              </div>
            </div>
          </div>

          {/* สลับอาจารย์ (Teacher Switcher) */}
          <div className="w-full md:w-auto md:shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>เลือกประเมินอาจารย์ท่านอื่น</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTeacherDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

        </div>

        {/* Dropdown เลือกลิสต์อาจารย์ */}
        {showTeacherDropdown && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fadeIn">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              แตะเลือกอาจารย์ผู้สอนที่ต้องการประเมิน:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {teachers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTeacher(t)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    selectedTeacher?.id === t.id
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <img
                    src={t.image_url}
                    alt={t.name}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
                    }}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{t.name}</p>
                    {t.subject && (
                      <p className={`text-[11px] truncate ${selectedTeacher?.id === t.id ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {t.subject}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* 2. นโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance Notice) */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-slate-800 dark:text-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-300">
                การคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance Notice)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม มุ่งมั่นคุ้มครองความเป็นส่วนตัวของผู้เรียนตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) การประเมินนี้จัดทำขึ้น<strong className="text-emerald-800 dark:text-emerald-400 font-bold">โดยไม่ระบุตัวตน (Anonymous)</strong> ไม่มีการจัดเก็บชื่อ-นามสกุล หรือรหัสประจำตัวผู้เรียน และข้อมูลของท่านจะไม่ถูกนำไปเปิดเผยต่อบุคคลภายนอก ข้อมูลเพศ ระดับชั้น และสาขาวิชาจะถูกนำไปประมวลผลเชิงสถิติในภาพรวมเพื่อพัฒนาคุณภาพการจัดการเรียนการสอนเท่านั้น โดยไม่ส่งผลกระทบต่อผลการเรียนของผู้เรียนใดๆ ทั้งสิ้น
            </p>
          </div>
        </div>
      </div>

      {/* 3. คำชี้แจง & เกณฑ์ระดับคะแนน (Clean & Lightweight 2-Row Layout) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-slate-800 dark:text-slate-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
        
        {/* แถวที่ 1: คำชี้แจง และ ข้อแนะนำการยกเลิก */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              คำชี้แจง: แตะเลือกคะแนน 1 ถึง 5 ในแต่ละข้อตามระดับความพึงพอใจของท่าน
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            💡 กดซ้ำที่คะแนนเดิมเพื่อยกเลิกการเลือก
          </p>
        </div>

        {/* แถวที่ 2: เกณฑ์คะแนน 5 ระดับ เรียง 5 ช่อง สะอาดตา ชัดเจน */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 shadow-sm">
            <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm sm:text-base block">1</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">ควรปรับปรุง</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-sm">
            <span className="font-extrabold text-amber-500 dark:text-amber-400 text-sm sm:text-base block">2</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">พอใช้</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-sky-200 dark:border-sky-900/50 shadow-sm">
            <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm sm:text-base block">3</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">ปานกลาง</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-teal-200 dark:border-teal-900/50 shadow-sm">
            <span className="font-extrabold text-teal-600 dark:text-teal-400 text-sm sm:text-base block">4</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">ดี</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 shadow-sm">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base block">5</span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">ดีเยี่ยม</span>
          </div>
        </div>

      </div>

      {/* 4. แถบความคืบหน้า (Sticky Progress Bar) */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 mb-6 transition-colors">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-2">
          <span className="text-slate-700 dark:text-slate-200">
            ความคืบหน้าการตอบแบบประเมิน:
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
            ตอบแล้ว {totalAnswered} จากทั้งหมด {questions.length} รายการ ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 5. ฟอร์มแบบประเมิน */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ข้อมูลเบื้องต้นของผู้ตอบแบบประเมิน: เพศ (ชาย/หญิง/ไม่ระบุ), ระดับชั้น, สาขาวิชา (ไม่ระบุค่าเริ่มต้น บังคับเลือกจริง) */}
        <div id="demographics-section" className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200 dark:border-slate-800">
          <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                ข้อมูลทั่วไปของผู้ตอบแบบประเมิน
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                โปรดระบุข้อมูลเพื่อใช้ในการสรุปสถิติตามเกณฑ์มาตรฐาน สอศ. (ข้อมูลเป็นความลับ ไม่ระบุตัวตน 100%)
              </p>
            </div>
            <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 shrink-0">
              * กรุณาเลือกข้อมูลให้ครบทุกช่อง
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 4.1 เพศ: ชาย, หญิง, ไม่ระบุเพศ (ทางการ ไม่มีไอคอนเด็ก) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                1. เพศของผู้ประเมิน <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setGender('ชาย'); setFormError(''); }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'ชาย'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300 dark:ring-sky-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>ชาย</span>
                  {gender === 'ชาย' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setGender('หญิง'); setFormError(''); }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'หญิง'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-md ring-2 ring-pink-300 dark:ring-pink-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>หญิง</span>
                  {gender === 'หญิง' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setGender('ไม่ระบุเพศ'); setFormError(''); }}
                  className={`flex items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'ไม่ระบุเพศ'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-400 dark:ring-slate-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>ไม่ระบุเพศ</span>
                  {gender === 'ไม่ระบุเพศ' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              </div>
            </div>

            {/* 4.2 ระดับชั้น: บังคับเลือก เริ่มต้นด้วย placeholder */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>2. ระดับชั้นเรียน <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={educationLevel}
                onChange={(e) => { setEducationLevel(e.target.value); setFormError(''); }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer transition-colors ${
                  !educationLevel 
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <option value="">-- กรุณาเลือกระดับชั้นเรียน --</option>
                {educationLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
                ))}
              </select>
            </div>

            {/* 4.3 สาขาวิชา: บังคับเลือก เริ่มต้นด้วย placeholder */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>3. สาขาวิชาที่ศึกษา <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={major}
                onChange={(e) => { setMajor(e.target.value); setFormError(''); }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer transition-colors ${
                  !major 
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <option value="">-- กรุณาเลือกสาขาวิชาที่ศึกษา --</option>
                {majors.map((maj) => (
                  <option key={maj.id} value={maj.name}>{maj.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* รายการคำถามจำแนกตามหมวดหมู่ */}
        {Object.entries(groupedQuestions).map(([category, catQuestions], groupIdx) => (
          <section key={category} className="space-y-4">
            
            {/* Category Header */}
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs shadow-sm">
                {groupIdx + 1}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {category}
              </h2>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {catQuestions.map((q, idx) => {
                const { itemNumber, cleanText } = formatQuestionItem(groupIdx, idx, q.question_text);
                const isTextQuestion = q.question_type === 'text';
                const currentScore = scores[q.id];
                const currentText = textAnswers[q.id] || '';

                return (
                  <div
                    key={q.id}
                    id={`question-${q.id}`}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 ${
                      isTextQuestion
                        ? currentText.trim()
                          ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/80'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : currentScore
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-emerald-700 dark:text-emerald-400 font-black text-base sm:text-lg shrink-0 mt-0.5 min-w-[2.25rem]">
                        {itemNumber}
                      </span>
                      <div className="flex-1">
                        <label className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed cursor-pointer block">
                          {cleanText}
                        </label>
                        {isTextQuestion && (
                          <span className="inline-block mt-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                            แบบเขียนตอบ / ข้อเสนอแนะ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answer Area: Text Area for text question, 1-5 Score Buttons for rating */}
                    {isTextQuestion ? (
                      <div className="mt-2">
                        <textarea
                          rows={3}
                          value={currentText}
                          onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                          placeholder={`พิมพ์คำตอบหรือข้อเสนอแนะสำหรับข้อ ${itemNumber} ที่นี่...`}
                          className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed resize-none transition-all shadow-inner"
                        />
                      </div>
                    ) : (
                      /* Score Buttons (1-5) with Toggle/Deselect */
                      <div className="grid grid-cols-5 gap-2 sm:gap-3.5">
                        {[1, 2, 3, 4, 5].map((scoreNum) => {
                          const isSelected = currentScore === scoreNum;
                          const config = scoreConfig[scoreNum];
                          return (
                            <button
                              key={scoreNum}
                              type="button"
                              onClick={() => handleSelectScore(q.id, scoreNum)}
                              className={`flex flex-col items-center justify-center py-3 sm:py-3.5 px-1 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                                isSelected
                                  ? config.activeClass
                                  : config.defaultClass
                              }`}
                              title={`ให้คะแนน ${scoreNum} (${config.label}) - กดซ้ำเพื่อยกเลิก`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-lg sm:text-xl font-black">
                                  {scoreNum}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className={`text-[10px] sm:text-xs font-semibold mt-0.5 truncate max-w-full text-center ${isSelected ? config.activeText : 'text-slate-500 dark:text-slate-400'}`}>
                                {config.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </section>
        ))}

        {/* ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติม (แสดงเฉพาะเมื่อในรายการคำถามยังไม่มีคำถามแบบเขียนตอบ เพื่อไม่ให้ซ้ำซ้อน) */}
        {!hasCustomTextQuestions && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <span>ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติม</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                ข้อมูลส่วนนี้เป็นประโยชน์อย่างยิ่งต่อการพัฒนาคุณภาพการเรียนการสอน
              </p>
            </div>

            {/* ข้อ 3.3 สิ่งที่ต้องการให้ครูผู้สอนปรับปรุงหรือจัดกิจกรรมเพิ่มเติม */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                สิ่งที่นักศึกษาต้องการให้ครูผู้สอนปรับปรุงหรือจัดกิจกรรมเพิ่มเติม
              </label>
              <textarea
                rows={3}
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="พิมพ์สิ่งที่ต้องการให้อาจารย์ปรับปรุง เทคนิค หรือจัดกิจกรรมการเรียนรู้เพิ่มเติม..."
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed resize-none transition-all shadow-inner"
              />
            </div>

            {/* ข้อ 3.4 ความประทับใจที่มีต่อครูผู้สอน */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                ความประทับใจที่มีต่อครูผู้สอน
              </label>
              <textarea
                rows={3}
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                placeholder="พิมพ์ความประทับใจ จุดเด่นในการสอน หรือความรู้สึกดี ๆ ที่มีต่ออาจารย์ผู้สอน..."
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed resize-none transition-all shadow-inner"
              />
            </div>
          </div>
        )}

        {/* แสดงข้อความแจ้งเตือนเมื่อยังตอบไม่ครบ */}
        {formError && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-sm sm:text-base animate-shake font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ปุ่มส่งแบบประเมิน */}
        <div className="pt-2 pb-12">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 px-6 rounded-xl text-white font-extrabold text-base sm:text-lg shadow-md transition-all flex items-center justify-center gap-2.5 ${
              submitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl active:scale-[0.99] shadow-emerald-700/20'
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึกข้อมูลแบบประเมิน...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>ส่งแบบประเมินผล</span>
              </>
            )}
          </button>
        </div>

      </form>

    </main>
  );
};
