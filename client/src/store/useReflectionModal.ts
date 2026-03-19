import { create } from 'zustand';

interface ReflectionModalStore {
    isOpen: boolean;
    projectId?: string;
    open: (projectId?: string) => void;
    close: () => void;
}

export const useReflectionModal = create<ReflectionModalStore>((set) => ({
    isOpen: false,
    projectId: undefined,
    open: (projectId) => set({ isOpen: true, projectId }),
    close: () => set({ isOpen: false, projectId: undefined }),
}));
