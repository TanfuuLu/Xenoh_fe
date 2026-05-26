import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WeightUnit = 'kg' | 'lb'

interface PreferenceState {
  weightUnit: WeightUnit
  setWeightUnit: (weightUnit: WeightUnit) => void
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      weightUnit: 'kg',
      setWeightUnit: (weightUnit) => set({ weightUnit }),
    }),
    { name: 'xenoh-preferences' },
  ),
)
