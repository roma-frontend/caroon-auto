import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Vehicle { brand: string; model: string; year: string }

interface VehicleState {
  vehicle: Vehicle | null;
  setVehicle: (v: Vehicle) => void;
  clear: () => void;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      vehicle: null,
      setVehicle: (vehicle) => set({ vehicle }),
      clear: () => set({ vehicle: null }),
    }),
    { name: 'vehicle-storage' },
  ),
);
