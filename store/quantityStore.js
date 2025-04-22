import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useQuantityStore = create(
  persist(
    (set) => ({
      quantities: {}, // { [productId]: quantity }
      setQuantity: (productId, quantity) =>
        set((state) => ({
          quantities: { ...state.quantities, [productId]: quantity },
        })),
      getQuantity: (productId) => (state) => state.quantities[productId] || 1,
    }),
    { name: "product-quantities" }
  )
);
