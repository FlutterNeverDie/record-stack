import { create } from 'zustand';

export interface Frame {
  id: string;
  imageUrl: string | null;
  time: string | null; // 초기값은 null (아이콘 노출)
  text: string;
}

interface RecordStore {
  frames: Frame[];
  addFrame: (imageUrl: string) => void;
  removeFrame: (id: string) => void;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  reorderFrames: (startIndex: number, endIndex: number) => void;
  reset: () => void;
}

export const useRecordStore = create<RecordStore>((set) => ({
  frames: [],
  
  addFrame: (imageUrl: string) => set((state) => {
    if (state.frames.length >= 5) return state;
    
    const newFrame: Frame = {
      id: Math.random().toString(36).substring(2, 9),
      imageUrl,
      time: null, // 시간 자동 생성 안 함
      text: '',
    };
    
    // 빈 프레임이 맨 위에 위치하도록 새로운 프레임을 처음에 추가하지 않고,
    // 이미 App.tsx에서 빈 프레임을 상단에 렌더링하고 있으므로 여기서는 단순히 배열에 추가함
    return { frames: [...state.frames, newFrame] };
  }),
  
  removeFrame: (id: string) => set((state) => ({
    frames: state.frames.filter((f) => f.id !== id)
  })),
  
  updateFrame: (id: string, updates: Partial<Frame>) => set((state) => ({
    frames: state.frames.map((f) => f.id === id ? { ...f, ...updates } : f)
  })),
  
  reorderFrames: (startIndex: number, endIndex: number) => set((state) => {
    const newFrames = Array.from(state.frames);
    const [removed] = newFrames.splice(startIndex, 1);
    newFrames.splice(endIndex, 0, removed);
    return { frames: newFrames };
  }),
  
  reset: () => set({ frames: [] }),
}));
