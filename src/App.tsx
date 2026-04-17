import { useEffect, useRef, useState, useMemo } from 'react';
import { useRecordStore, Frame } from './store';
import { Plus, Trash2, Edit2, GripVertical, Clock } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
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
  const [isExporting, setIsExporting] = useState(false);
  
  // Modals state
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecordPopup, setShowRecordPopup] = useState(false);
  
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '.').replace(/\.$/, '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      addFrame(url);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      {/* Modals */}
      <AnimatePresence>
        {showTimePicker && (
          <TimeDialPicker 
            onSelect={(time) => {
              if (activeFrameId) updateFrame(activeFrameId, { time });
              setShowTimePicker(false);
            }} 
            onCancel={() => setShowTimePicker(false)} 
          />
        )}
        {showRecordPopup && (
          <RecordPopup 
            initialText={frames.find(f => f.id === activeFrameId)?.text || ''}
            onConfirm={(text) => {
              if (activeFrameId) updateFrame(activeFrameId, { text });
              setShowRecordPopup(false);
            }} 
            onCancel={() => setShowRecordPopup(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
