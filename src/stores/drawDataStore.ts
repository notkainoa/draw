import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DrawData = {
  [page_id: string]: {
    elements: readonly NonDeletedExcalidrawElement[];
    updatedAt: string;
    name: string;
    files?: BinaryFiles;
  };
};

type DrawDataStore = {
  data: DrawData;
  setPageData: (
    page_id: string,
    elements: readonly NonDeletedExcalidrawElement[],
    updatedAt: string,
    name: string,
    files?: BinaryFiles,
  ) => void;
  getPageData: (page_id: string) => DrawData[string] | undefined;
};

const drawDataStore = create<DrawDataStore>()(
  persist(
    (set, get) => ({
      data: {},
      setPageData: (page_id, elements, updatedAt, name, files) =>
        set((state) => {
          const currentData = state.data[page_id];
          if (
            !currentData ||
            new Date(updatedAt) > new Date(currentData.updatedAt)
          ) {
            return {
              data: {
                ...state.data,
                [page_id]: { elements, updatedAt, name, files: files || {} },
              },
            };
          }
          return state;
        }),
      getPageData: (page_id) => get().data[page_id],
    }),
    {
      name: "draw-data-store",
    },
  ),
);

export { drawDataStore };
