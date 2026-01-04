import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageDefinition, ComponentDefinition, ResourceDefinition } from '../types';

interface BuilderState {
  // Currently editing page
  currentPage: PageDefinition | null;
  // Selected component
  selectedComponent: string | null;
  // Custom resource definitions
  customResources: ResourceDefinition[];
  // Saved pages list
  savedPages: PageDefinition[];

  // Actions
  setCurrentPage: (page: PageDefinition | null) => void;
  selectComponent: (componentId: string | null) => void;
  addComponent: (component: ComponentDefinition, parentId?: string) => void;
  updateComponent: (componentId: string, updates: Partial<ComponentDefinition>) => void;
  removeComponent: (componentId: string) => void;
  moveComponent: (componentId: string, newParentId: string | null, index: number) => void;
  savePage: () => void;
  loadPage: (pageId: string) => void;
  addCustomResource: (resource: ResourceDefinition) => void;
  updateCustomResource: (name: string, updates: Partial<ResourceDefinition>) => void;
  removeCustomResource: (name: string) => void;
}

// Helper: Find component in tree
function findComponent(
  components: ComponentDefinition[],
  id: string
): ComponentDefinition | null {
  for (const comp of components) {
    if (comp.id === id) return comp;
    if (comp.children) {
      const found = findComponent(comp.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper: Update component in tree
const updateComponentInTree = (
  components: ComponentDefinition[],
  id: string,
  updates: Partial<ComponentDefinition>
): ComponentDefinition[] => {
  return components.map((comp) => {
    if (comp.id === id) {
      return { ...comp, ...updates };
    }
    if (comp.children) {
      return {
        ...comp,
        children: updateComponentInTree(comp.children, id, updates),
      };
    }
    return comp;
  });
};

// Helper: Remove component from tree
const removeComponentFromTree = (
  components: ComponentDefinition[],
  id: string
): ComponentDefinition[] => {
  return components
    .filter((comp) => comp.id !== id)
    .map((comp) => {
      if (comp.children) {
        return {
          ...comp,
          children: removeComponentFromTree(comp.children, id),
        };
      }
      return comp;
    });
};

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      currentPage: null,
      selectedComponent: null,
      customResources: [],
      savedPages: [],

      setCurrentPage: (page) => set({ currentPage: page, selectedComponent: null }),

      selectComponent: (componentId) => set({ selectedComponent: componentId }),

      addComponent: (component, parentId) =>
        set((state) => {
          if (!state.currentPage) return state;

          if (!parentId) {
            return {
              currentPage: {
                ...state.currentPage,
                components: [...state.currentPage.components, component],
              },
            };
          }

          const addToParent = (components: ComponentDefinition[]): ComponentDefinition[] => {
            return components.map((comp) => {
              if (comp.id === parentId) {
                return {
                  ...comp,
                  children: [...(comp.children || []), component],
                };
              }
              if (comp.children) {
                return { ...comp, children: addToParent(comp.children) };
              }
              return comp;
            });
          };

          return {
            currentPage: {
              ...state.currentPage,
              components: addToParent(state.currentPage.components),
            },
          };
        }),

      updateComponent: (componentId, updates) =>
        set((state) => {
          if (!state.currentPage) return state;
          return {
            currentPage: {
              ...state.currentPage,
              components: updateComponentInTree(state.currentPage.components, componentId, updates),
            },
          };
        }),

      removeComponent: (componentId) =>
        set((state) => {
          if (!state.currentPage) return state;
          return {
            currentPage: {
              ...state.currentPage,
              components: removeComponentFromTree(state.currentPage.components, componentId),
            },
            selectedComponent:
              state.selectedComponent === componentId ? null : state.selectedComponent,
          };
        }),

      moveComponent: (componentId, newParentId, index) =>
        set((state) => {
          if (!state.currentPage) return state;

          const component = findComponent(state.currentPage.components, componentId);
          if (!component) return state;

          // First remove from current position
          let newComponents = removeComponentFromTree(state.currentPage.components, componentId);

          // Add to new position
          if (!newParentId) {
            newComponents.splice(index, 0, component);
          } else {
            const addAtIndex = (components: ComponentDefinition[]): ComponentDefinition[] => {
              return components.map((comp) => {
                if (comp.id === newParentId) {
                  const children = [...(comp.children || [])];
                  children.splice(index, 0, component);
                  return { ...comp, children };
                }
                if (comp.children) {
                  return { ...comp, children: addAtIndex(comp.children) };
                }
                return comp;
              });
            };
            newComponents = addAtIndex(newComponents);
          }

          return {
            currentPage: {
              ...state.currentPage,
              components: newComponents,
            },
          };
        }),

      savePage: () =>
        set((state) => {
          if (!state.currentPage) return state;

          const existingIndex = state.savedPages.findIndex((p) => p.id === state.currentPage!.id);
          const newSavedPages = [...state.savedPages];

          if (existingIndex >= 0) {
            newSavedPages[existingIndex] = state.currentPage;
          } else {
            newSavedPages.push(state.currentPage);
          }

          return { savedPages: newSavedPages };
        }),

      loadPage: (pageId) =>
        set((state) => {
          const page = state.savedPages.find((p) => p.id === pageId);
          return { currentPage: page || null, selectedComponent: null };
        }),

      addCustomResource: (resource) =>
        set((state) => ({
          customResources: [...state.customResources, resource],
        })),

      updateCustomResource: (name, updates) =>
        set((state) => ({
          customResources: state.customResources.map((r) =>
            r.name === name ? { ...r, ...updates } : r
          ),
        })),

      removeCustomResource: (name) =>
        set((state) => ({
          customResources: state.customResources.filter((r) => r.name !== name),
        })),
    }),
    {
      name: 'builder-storage',
    }
  )
);
