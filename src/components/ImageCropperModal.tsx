import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  RotateCcw, 
  User, 
  Sparkles,
  Crop
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  teacherName?: string;
}

const BOX_SIZE = 260; // ขนาดกรอบบนหน้าจอ (px)
const OUTPUT_SIZE = 400; // ขนาดรูปจริงที่ Export ออกมา (px)

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  teacherName,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalDim, setNaturalDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // โหลดขนาดต้นฉบับของรูปภาพ
  useEffect(() => {
    if (!imageSrc || !isOpen) return;
    setErrorMsg('');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalDim({ width: img.naturalWidth, height: img.naturalHeight });
      // ค่าเริ่มต้น: หากเป็นรูปทรงสูง (Portrait) ให้เลื่อนลงมาเน้นช่วงบน (ใบหน้าและศีรษะ) อัตโนมัติ
      if (img.naturalHeight > img.naturalWidth) {
        const baseScale = Math.max(BOX_SIZE / img.naturalWidth, BOX_SIZE / img.naturalHeight);
        const renderedHeight = img.naturalHeight * baseScale;
        // เลื่อนลงมาประมาณ 30% ของส่วนเกิน เพื่อให้เห็นศีรษะครบ
        const initialYOffset = (renderedHeight - BOX_SIZE) * 0.35;
        setOffset({ x: 0, y: initialYOffset });
      } else {
        setOffset({ x: 0, y: 0 });
      }
      setZoom(1);
    };
    img.onerror = () => {
      setErrorMsg('ไม่สามารถโหลดรูปภาพได้ กรุณาตรวจสอบลิงก์หรืออัปโหลดไฟล์จากเครื่องโดยตรง');
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // คำนวณ Scale ฐาน และพิกัดตำแหน่ง
  const baseScale = naturalDim.width && naturalDim.height
    ? Math.max(BOX_SIZE / naturalDim.width, BOX_SIZE / naturalDim.height)
    : 1;

  const currentScale = baseScale * zoom;
  const renderedWidth = naturalDim.width * currentScale;
  const renderedHeight = naturalDim.height * currentScale;

  const initX = (BOX_SIZE - renderedWidth) / 2;
  const initY = (BOX_SIZE - renderedHeight) / 2;

  // จำกัดขอบเขตการลากไม่ให้หลุดกรอบมากเกินไป
  const maxDragX = Math.max(0, (renderedWidth - BOX_SIZE) / 2) + 40;
  const maxDragY = Math.max(0, (renderedHeight - BOX_SIZE) / 2) + 40;

  const clampedOffsetX = Math.max(-maxDragX, Math.min(maxDragX, offset.x));
  const clampedOffsetY = Math.max(-maxDragY, Math.min(maxDragY, offset.y));

  const imgPosX = initX + clampedOffsetX;
  const imgPosY = initY + clampedOffsetY;

  // จัดการการลากด้วยเมาส์ (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // จัดการการลากด้วยนิ้วบนมือถือ (Touch Drag)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // ฟังก์ชัน Preset สำหรับเลือกตำแหน่งด่วน
  const handlePresetFocusFace = () => {
    // ดันภาพลงเพื่อให้กรอบมองเห็นส่วนบนของภาพ (ศีรษะ/ใบหน้า)
    const extraH = renderedHeight - BOX_SIZE;
    if (extraH > 0) {
      setOffset({ x: 0, y: extraH * 0.45 });
    }
  };

  const handlePresetCenter = () => {
    setOffset({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // สร้างภาพผลลัพธ์ผ่าน HTML5 Canvas เมื่อกดบันทึก
  const handleConfirmCrop = useCallback(() => {
    if (!naturalDim.width || !naturalDim.height) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // อัตราส่วนระหว่าง Output Canvas กับ Viewport Screen
        const ratio = OUTPUT_SIZE / BOX_SIZE;

        // วาดภาพที่ตำแหน่งตามที่ผู้ใช้เลื่อน
        ctx.drawImage(
          img,
          imgPosX * ratio,
          imgPosY * ratio,
          renderedWidth * ratio,
          renderedHeight * ratio
        );

        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.90);
        onCropComplete(croppedBase64);
        onClose();
      };
      img.onerror = () => {
        alert('เกิดข้อผิดพลาดในการครอบรูป กรุณาลองอัปโหลดเป็นไฟล์รูปตรงจากเครื่อง');
      };
      img.src = imageSrc;
    } catch (err) {
      console.error('Failed to crop image:', err);
      alert('ไม่สามารถครอบตัดรูปนี้ได้เนื่องจากข้อจำกัดความปลอดภัยของลิงก์ แนะนำให้อัปโหลดไฟล์รูปโดยตรงจากคอมพิวเตอร์');
    }
  }, [naturalDim, imgPosX, imgPosY, renderedWidth, renderedHeight, imageSrc, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp overflow-hidden max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ปรับตำแหน่งและครอบตัดรูปภาพ
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {teacherName ? `สำหรับ: ${teacherName}` : 'ลากเลื่อนเพื่อเลือกส่วนที่ต้องการแสดงในกรอบ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {errorMsg ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          ) : (
            <>
              {/* Interactive Cropper Viewport */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative overflow-hidden rounded-2xl border-4 border-emerald-500 shadow-2xl bg-slate-950 select-none touch-none cursor-grab active:cursor-grabbing"
                  style={{ width: `${BOX_SIZE}px`, height: `${BOX_SIZE}px` }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Image being dragged/zoomed */}
                  {naturalDim.width > 0 && (
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop target"
                      draggable={false}
                      className="absolute max-w-none transition-none pointer-events-none select-none"
                      style={{
                        width: `${renderedWidth}px`,
                        height: `${renderedHeight}px`,
                        left: `${imgPosX}px`,
                        top: `${imgPosY}px`,
                      }}
                    />
                  )}

                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-b border-white/15"></div>
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-b border-white/15"></div>
                    <div className="border-r border-white/15"></div>
                    <div className="border-r border-white/15"></div>
                    <div></div>
                  </div>

                  {/* Helper Tag */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/65 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full pointer-events-none flex items-center gap-1 shadow">
                    <Move className="w-2.5 h-2.5" />
                    <span>คลิกค้างแล้วลากเพื่อเลื่อนตำแหน่ง</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  💡 กรอบนี้มีอัตราส่วน <strong className="text-emerald-600 font-bold">1:1</strong> เท่ากับที่แสดงในหน้าประเมินและบัตรประจำตัวครูพอดี
                </p>
              </div>

              {/* Zoom Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ซูมเข้า / ซูมออก (Zoom)</span>
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(1, prev - 0.1))}
                    disabled={zoom <= 1}
                    className="p-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                    title="ซูมออก"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
                    disabled={zoom >= 3}
                    className="p-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                    title="ซูมเข้า"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  ตำแหน่งลัด (Quick Presets)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handlePresetFocusFace}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>เน้นใบหน้า/ช่วงบน</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePresetCenter}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>กึ่งกลางรูป</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตเดิม</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={Boolean(errorMsg) || naturalDim.width === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>ยืนยันการครอบรูป (ใช้รูปนี้)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
