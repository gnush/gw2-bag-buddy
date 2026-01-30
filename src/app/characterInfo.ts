import { DisplaybeItem } from "./displayableItem";
import { InventoryBag } from "./inventoryBag";

export interface CharacterInfo {
    name: string;
    race: string;
    gender: string;
    profession: string;
    level: number;
    equippedBags: (InventoryBag | null)[];
    jadebotPowerCore: DisplaybeItem | null;
    jadebotSensoryArray: DisplaybeItem | null;
    jadebotServiceChip: DisplaybeItem | null;
    totalInventorySlots: () => number;
    usedInventorySlots: () => number;
}

export class MyCharacterInfo implements CharacterInfo {
    constructor(
        public name: string,
        public race: string,
        public gender: string,
        public profession: string,
        public level: number,
        public equippedBags: (InventoryBag|null)[],
        public jadebotPowerCore: DisplaybeItem | null,
        public jadebotSensoryArray: DisplaybeItem | null,
        public jadebotServiceChip: DisplaybeItem | null
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