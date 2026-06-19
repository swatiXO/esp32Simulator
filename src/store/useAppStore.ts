import { create } from "zustand";

import type { Block, DeviceStatus, LiveLogEntry } from "@/types";

type AppStore = {
  // Blocks state
  blocks: Block[];
  addBlock: (block: Omit<Block, "id">) => void;
  removeBlock: (id: number) => void;
  updateBlockValue: (id: number, param: string, value: string | number) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  clearBlocks: () => void;

  // Device state
  activeDeviceId: string | null;
  deviceStatus: DeviceStatus;
  loopMode: boolean;
  savedProgramExists: boolean;
  savedProgramLoop: boolean;
  setActiveDeviceId: (id: string | null) => void;
  setDeviceStatus: (status: DeviceStatus) => void;
  setLoopMode: (loop: boolean) => void;
  setSavedProgram: (exists: boolean, loop: boolean) => void;

  // Live log state
  liveLog: LiveLogEntry[];
  addLogEntry: (message: string, type: LiveLogEntry["type"]) => void;
  clearLog: () => void;
  resetStore: () => void;
};

let logEntryIdCounter = 1;

export const useAppStore = create<AppStore>((set) => ({
  // Blocks state
  blocks: [],
  addBlock: (block) =>
    set((state) => {
      const nextId = state.blocks.length > 0 ? Math.max(...state.blocks.map((b) => b.id)) + 1 : 1;
      return {
        blocks: [...state.blocks, { ...block, id: nextId }],
      };
    }),
  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((block) => block.id !== id),
    })),
  updateBlockValue: (id, param, value) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id
          ? {
              ...block,
              values: {
                ...block.values,
                [param]: value,
              },
            }
          : block,
      ),
    })),
  reorderBlocks: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.blocks.length ||
        toIndex >= state.blocks.length ||
        fromIndex === toIndex
      ) {
        return state;
      }

      const nextBlocks = [...state.blocks];
      const [moved] = nextBlocks.splice(fromIndex, 1);
      nextBlocks.splice(toIndex, 0, moved);

      return { blocks: nextBlocks };
    }),
  clearBlocks: () => set({ blocks: [] }),

  // Device state
  activeDeviceId: null,
  deviceStatus: "idle",
  loopMode: false,
  savedProgramExists: false,
  savedProgramLoop: false,
  setActiveDeviceId: (id) => set({ activeDeviceId: id }),
  setDeviceStatus: (status) => set({ deviceStatus: status }),
  setLoopMode: (loop) => set({ loopMode: loop }),
  setSavedProgram: (exists, loop) =>
    set({
      savedProgramExists: exists,
      savedProgramLoop: loop,
    }),

  // Live log state
  liveLog: [],
  addLogEntry: (message, type) =>
    set((state) => {
      const entry: LiveLogEntry = {
        id: logEntryIdCounter++,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message,
        type,
      };

      return {
        liveLog: [...state.liveLog, entry].slice(-100),
      };
    }),
  clearLog: () => set({ liveLog: [] }),
  resetStore: () => set({
    blocks: [],
    activeDeviceId: null,
    deviceStatus: "idle",
    loopMode: false,
    savedProgramExists: false,
    savedProgramLoop: false,
    liveLog: [],
  }),
}));
