import { useEffect, useRef, useState, useMemo } from 'react';
import { useRecordStore } from './store';
import type { Frame } from './store';
import { Plus, Trash2, Edit2, GripVertical, Clock } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import heic2any from 'heic2any';
import './App.css';

// --- Sub Components ---

const TimeDialPicker = ({ onSelect, onCancel }: { onSelect: (time: string) => void, onCancel: () => void }) => {
  const hours = useMemo(() => Array.from({ length: 25 }, (_, i) => String(i).padStart(2, '0') + ':00'), []);
  const [selected, setSelected] = useState('12:00');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => onSelect(selected);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <motion.div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h3 className="modal-title">시간 선택</h3>
        <div className="time-dial-container" ref={scrollRef}>
          {hours.map(h => (
            <div 
              key={h} 
              className={`time-option ${selected === h ? 'selected' : ''}`}
              onClick={() => setSelected(h)}
            >
              {h}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>취소</button>
          <button className="modal-btn confirm" onClick={handleConfirm}>확인</button>
        </div>
      </motion.div>
    </div>
  );
};

const RecordPopup = ({ initialText, onConfirm, onCancel }: { initialText: string, onConfirm: (text: string) => void, onCancel: () => void }) => {
  const [text, setText] = useState(initialText);
  
  const handleConfirm = () => {
    onConfirm(text);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <motion.div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h3 className="modal-title">기록 남기기</h3>
        <div className="record-input-wrapper">
          <input 
            autoFocus
            className="record-input"
            value={text}
            onChange={e => setText(e.target.value.slice(0, 10))}
            placeholder="어떤 순간이었나요?"
          />
          <div className="char-count">{text.length}/10</div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>취소</button>
          <button className="modal-btn confirm" onClick={handleConfirm}>완료</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

function App() {
  const { frames, addFrame, removeFrame, updateFrame, reorderFrames } = useRecordStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntro, setIsIntro] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  // Modals state
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecordPopup, setShowRecordPopup] = useState(false);
  
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '.').replace(/\.$/, '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    try {
      let finalFile: File | Blob = file;

      // HEIC/HEIF 파일인 경우 변환 시도
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic';
      
      if (isHeic) {
        // heic2any 라이브러리가 설치되어 있어야 합니다.
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        finalFile = Array.isArray(converted) ? converted[0] : (converted as Blob);
      }

      const url = URL.createObjectURL(finalFile);
      addFrame(url);
    } catch (err) {
      console.error("이미지 업로드/변환 실패:", err);
      alert("이미지 처리 중 오류가 발생했습니다. (heic2any 라이브러리가 설치되어 있는지 확인해 주세요)");
    } finally {
      setIsConverting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (containerRef.current) {
      setIsExporting(true);
      setTimeout(async () => {
        try {
          const dataUrl = await toPng(containerRef.current!, { 
            quality: 1, 
            pixelRatio: 3,
            backgroundColor: 'white',
            style: { height: 'auto', overflow: 'visible' }
          });
          const link = document.createElement('a');
          link.download = `하루5컷_${today}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error("저장 실패:", err);
        } finally {
          setIsExporting(false);
        }
      }, 300);
    }
  };

  return (
    <div className={`app-container ${isExporting ? 'is-exporting' : ''}`} ref={containerRef}>
      <AnimatePresence mode="wait">
        {isIntro ? (
          <motion.div
            key="intro"
            className="intro-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="intro-content">
              <motion.div 
                className="intro-icon-box"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <svg width="60" height="52" viewBox="0 0 60 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="intro-icon-svg">
                  <rect width="60" height="8" rx="4" fill="black" fillOpacity="1" />
                  <rect y="11" width="48" height="8" rx="4" fill="black" fillOpacity="0.8" />
                  <rect y="22" width="36" height="8" rx="4" fill="black" fillOpacity="0.6" />
                  <rect y="33" width="24" height="8" rx="4" fill="black" fillOpacity="0.4" />
                  <rect y="44" width="12" height="8" rx="4" fill="black" fillOpacity="0.2" />
                </svg>
              </motion.div>
              <motion.h1 
                className="intro-title"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                하루 5컷
              </motion.h1>
              <motion.p 
                className="intro-subtitle"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                오늘의 소중한 순간들을<br />한 장의 기록으로 남기세요.
              </motion.p>
              <motion.button 
                className="start-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsIntro(false)}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                기록 시작하기
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            className="main-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
          >
            {!isExporting && (
              <header className="main-header">
                <span className="date-tag">{today}</span>
                <h1 className="main-title">하루 5컷</h1>
              </header>
            )}

            <main className="frame-stack">
              <div className="frames-container">
                {!isExporting && frames.length < 5 && (
                  <motion.div layout className="empty-frame" onClick={() => fileInputRef.current?.click()} whileTap={{ scale: 0.98 }}>
                    <Plus size={32} strokeWidth={1} />
                    <p>오늘의 순간 기록하기</p>
                  </motion.div>
                )}

                <Reorder.Group axis="y" values={frames} onReorder={reorderFrames} className="reorder-group">
                  <AnimatePresence initial={false}>
                    {frames.map((frame) => (
                      <Reorder.Item key={frame.id} value={frame} className="frame-item">
                        <div className="frame-image-wrapper">
                          {frame.imageUrl && <img src={frame.imageUrl} alt="Record" className="frame-image" />}
                          
                          <div className="frame-overlay">
                            {frame.time ? (
                              <div className="frame-info" onClick={() => {
                                setActiveFrameId(frame.id);
                                setShowRecordPopup(true);
                              }}>
                                <div className="time-text">{frame.time}</div>
                                <div className="status-text">{frame.text || "터치하여 기록하기"}</div>
                              </div>
                            ) : (
                              <div className="frame-info" onClick={() => {
                                setActiveFrameId(frame.id);
                                setShowTimePicker(true);
                              }}>
                                <Clock size={48} color="white" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>

                          {!isExporting && (
                            <div className="frame-edit-ui">
                              <button className="icon-btn" onClick={() => {
                                setActiveFrameId(frame.id);
                                setShowTimePicker(true);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              <button className="icon-btn" onClick={() => removeFrame(frame.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}

                          {!isExporting && (
                            <div className="drag-handle-ui">
                              <GripVertical size={20} />
                            </div>
                          )}
                        </div>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </div>
            </main>

            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />

            {!isExporting && (
              <footer className="action-bar">
                <button className="download-btn" onClick={handleDownload} disabled={frames.length === 0}>
                  사진 저장하기
                </button>
              </footer>
            )}

            {/* Modals & Overlays */}
            <AnimatePresence>
              {showTimePicker && (
                <TimeDialPicker 
                  key="time-picker"
                  onSelect={(time) => {
                    if (activeFrameId) updateFrame(activeFrameId, { time });
                    setShowTimePicker(false);
                  }} 
                  onCancel={() => setShowTimePicker(false)} 
                />
              )}
              {showRecordPopup && (
                <RecordPopup 
                  key="record-popup"
                  initialText={frames.find(f => f.id === activeFrameId)?.text || ''}
                  onConfirm={(text) => {
                    if (activeFrameId) updateFrame(activeFrameId, { text });
                    setShowRecordPopup(false);
                  }} 
                  onCancel={() => setShowRecordPopup(false)}
                />
              )}
              {isConverting && (
                <motion.div 
                  key="loading"
                  className="loading-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="loading-spinner" />
                  <p>이미지 변환 중...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
