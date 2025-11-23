import { InventoryBag } from "./inventoryBag";

export interface CharacterInfo {
    id: number;
    name: string;
    equippedBags: InventoryBag[];
    totalInventorySlots: () => number;
    usedInventorySlots: () => number;
}

export class MyCharacterInfo implements CharacterInfo {
    constructor(public id: number, public name: string, public equippedBags: InventoryBag[]) {}

    totalInventorySlots(): number {
        var slots = 0;
        this.equippedBags.forEach((bag) => slots += bag.totalSlots);
        return slots;
    }

    usedInventorySlots(): number {
        var slots = 0;
        this.equippedBags.forEach((bag) => slots += bag.usedSlots);
        return slots;
    }
}