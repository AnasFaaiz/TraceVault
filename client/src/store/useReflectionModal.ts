import { create } from 'zustand';

interface ReflectionData {
    id?: string;
    projectId: string;
    title: string;
    type: string;
    impact: string;
    content: string;
}

interface ReflectionModalStore {
    isOpen: boolean;
    projectId?: string;
    initialData?: ReflectionData;
    open: (projectId?: string, initialData?: ReflectionData) => void;
    close: () => void;
}

export const useReflectionModal = create<ReflectionModalStore>((set) => ({
    isOpen: false,
    projectId: undefined,
    initialData: undefined,
    open: (projectId, initialData) => set({ isOpen: true, projectId, initialData }),
    close: () => set({ isOpen: false, projectId: undefined, initialData: undefined }),
}));
