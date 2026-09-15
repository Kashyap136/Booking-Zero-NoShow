import { to12 } from "./utils";

export interface SlotOption {
  value: string;
  label: string;
}

export function generateSlots(): SlotOption[] {
  const slots: SlotOption[] = [];
  for (let h = 9; h < 20; h++) {
    for (const min of [0, 30]) {
      const endH = min === 30 ? h + 1 : h;
      const endM = min === 30 ? 0 : 30;
      const start = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      slots.push({ value: `${start}-${end}`, label: `${to12(start)} – ${to12(end)}` });
    }
  }
  return slots;
}