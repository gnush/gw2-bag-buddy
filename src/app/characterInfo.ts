import { InventoryBag } from "./inventoryBag";

export interface CharacterInfo {
    name: string;
    profession: string;
    level: number;
    equippedBags: (InventoryBag|null)[];
    totalInventorySlots: () => number;
    usedInventorySlots: () => number;
}

export class MyCharacterInfo implements CharacterInfo {
    constructor(
        public name: string,
        public profession: string,
        public level: number,
        public equippedBags: (InventoryBag|null)[]
    ) {}

    totalInventorySlots(): number {
        var slots = 0;
        this.equippedBags.forEach((bag) => slots += bag?.totalSlots ?? 0);
        return slots;
    }

    usedInventorySlots(): number {
        var slots = 0;
        this.equippedBags.forEach((bag) => slots += bag?.usedSlots ?? 0);
        return slots;
    }
}