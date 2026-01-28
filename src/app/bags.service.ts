import { inject, Injectable, signal } from '@angular/core';
import { CharacterInfo, MyCharacterInfo } from './characterInfo';
import { InventoryBag } from './inventoryBag';
import { ApiKeyService } from './apiKey.service';
import { DisplaybeItem } from './displayableItem';

@Injectable({
  providedIn: 'root',
})
export class BagsService {
  private apiKeyService = inject(ApiKeyService);

  private readonly gw2ApiBase = 'https://api.guildwars2.com/v2';

  // https://wiki.guildwars2.com/wiki/API:Main
  public readonly requiredApiKeyPermissions = ['account','characters', 'inventories'];

  private readonly characters = signal<CharacterInfo[]>([]);
  public getCharacters() { return this.characters() }

  // TODO: export signal captured type to interface
  private readonly unusedBags = signal<{bag: InventoryBag; location: string}[]>([]);
  public getUnusedBags() { return this.unusedBags() }

  private readonly bagSlotExpansions = signal<{ location: string; count: number }[]>([]);
  public getBagSlotExpansions() { return this.bagSlotExpansions() }

  // constructor(public foo: BagDetails | UnlockDetails | undefined) {
  //   // bag slot expansion id: 19993
  //   this.bagSlotExpansion = "";

  //   switch(typeof foo) {
  //     case "object": ;
  //   }
  // }

  repopulateBags() {
    this.characters.set([]);
    this.unusedBags.set([]);
    this.bagSlotExpansions.set([]);

    this.populateEquippedCharacterBags();
    this.populateUnusedBankBags();
    this.populateUnusedSharedInventoryBags();
  }

  // TODO: remove/merge?
  public repopulateEquippedBagsAndJadebotComponents() {
    this.characters.set([]);
    this.populateEquippedCharacterBags();
  }

  // TODO: unify unused bag functions
  async populateUnusedSharedInventoryBags() {
    if (this.apiKeyService.checkAccessTokenPermissions(['account', 'inventories'])) {
      const data: (SharedInventoryItemResponse|null)[] = await ((await fetch(`${this.gw2ApiBase}/account/inventory?access_token=${this.apiKeyService.apiAccessToken()}`))).json() ?? [];
      const sharedInventory: SharedInventoryItemResponse[] = data.filter(item => item != null);

      const items: ItemResponse[] = (await this.lookupItemIds(
        sharedInventory.map(item => item.id)
      ));

      for (const sharedInventoryItem of sharedInventory) {
        const itemResponse = items.find(item => item.id === sharedInventoryItem.id);
        if (itemResponse !== undefined) {
          const bag = this.itemResponseToInventoryBag(itemResponse, sharedInventoryItem.binding, undefined);
          if (bag != null)
            this.unusedBags.update(old =>
              [
                ...old,
                {
                  bag: bag,
                  location: 'Shared Inventory'
                }
              ]
            );
        }
      }

      // loses access to 'binding' of shared inventory item
      // sharedInventory
      //   .map(item => items.find(itemResponse => itemResponse.id == item.id))
      //   .filter(item => item !== undefined)
      //   .map(item => this.itemResponseToInventoryBag(item, ''))
      //   .filter(item => item != null)
      //   .forEach(bag => this.unusedBags.update(old => [
      //     ...old,
      //     bag
      //   ]));
    }
  }

  async populateUnusedBankBags() {
    if (this.apiKeyService.checkAccessTokenPermissions(['account', 'inventories'])) {
      const data: (BankResponse|null)[] = await (await fetch(`${this.gw2ApiBase}/account/bank?access_token=${this.apiKeyService.apiAccessToken()}`)).json() ?? [];
      const bankContent: BankResponse[] = data.filter(item => item != null);

      const items: ItemResponse[] = await this.lookupItemIds(bankContent.map(item => item.id));

      for (const bankItem of bankContent) {
        const itemInfo = items.find(item => item.id === bankItem.id);

        if (itemInfo != undefined) {
          const bag = this.itemResponseToInventoryBag(
            itemInfo,
            bankItem.binding,
            bankItem.bound_to
          );
          if (bag != null)
            this.unusedBags.update(old => 
              [
                ...old,
                {
                  bag: bag,
                  location: 'Bank'
                }
              ]
            );
        }
      }
    }
  }

  // TODO: rename function to reflect changes (also search for equipped jadebot components)
  async populateEquippedCharacterBags() {
    if (this.apiKeyService.checkAccessTokenPermissions(['account', 'characters'])) {
      const data: Promise<Character[]> = (await fetch(`${this.gw2ApiBase}/characters?ids=all&v=latest&access_token=${this.apiKeyService.apiAccessToken()}`)).json() ?? [];
      const characters: Character[] = await data;

      // search unused bags in character inventories
      characters.forEach(character =>
        this.unusedCharacterInventoryBags(
          (character.bags ?? []).flatMap(x => x?.inventory)
                                .filter(x => x !== null && x !== undefined)
        ).then(bags =>
          bags.forEach(bag => this.addUnusedBag(bag, character.name))
        )
      );

      // search for equipped bags and equipped jadebot components on each character
      for (const character of characters) {
        const bags = await this.equippedBags(character.name, character.bags ?? []);

        var powerCore: DisplaybeItem|null = null;
        var sensoryArray: DisplaybeItem|null = null;
        var serviceChip: DisplaybeItem|null = null;

        for (const equippedItem of character.equipment) {
          switch(equippedItem.slot) {
            case 'PowerCore':
              powerCore = this.itemResponseToDisplayableItem(await this.lookupItemId(equippedItem.id));
              break;
            case 'SensoryArray':
              sensoryArray = this.itemResponseToDisplayableItem(await this.lookupItemId(equippedItem.id));
              break;
            case 'ServiceChip':
              serviceChip = this.itemResponseToDisplayableItem(await this.lookupItemId(equippedItem.id));
              break;
            default:
          }
        }

        this.addCharacter(character.name, character.profession, character.level, bags, powerCore, sensoryArray, serviceChip);
      }
    }
  }

  /**
   * Helper for populateEquippedCharacterBags
   */
  private async unusedCharacterInventoryBags(inventory: InventorySlot[]): Promise<InventoryBag[]> {
    const items = await this.lookupItemIds(inventory.map(item => item.id));

    return inventory
      .map(inventoryItem =>
        this.itemResponseToInventoryBag(
          items.find(item => inventoryItem.id === item.id),
          inventoryItem.binding,
          inventoryItem.bound_to
        )
      )
      .filter(x => x !== null);
  }

  private async equippedBags(characterName: string, bags: (Bag|null)[]): Promise<(InventoryBag|null)[]> {
    const ids = bags.filter(bag => bag != null)
                    .map(bag => bag.id);
    const bagInfos: ItemResponse[] = await this.lookupItemIds(ids);

    return bags.map(bag =>
      bag !== null ?
        this.equippedBagToInventoryBag(bag, characterName, bagInfos.find(item => item.id == bag.id)) :
        null
    );
  }

  private itemResponseToInventoryBag(item: ItemResponse | undefined, binding: string|undefined, bound_to: string|undefined): InventoryBag|null {
    if (item === undefined || item.type !== 'Bag')
      return null;
      
    return {
      itemId: item.id,
      name: item.name,
      desciption: item.description,
      chatLink: item.chat_link,
      icon: item.icon,
      totalSlots: item.details?.size ?? 0,
      usedSlots: 0,
      boundTo: bound_to ?? (binding ?? '')
    }
  }

  private itemResponseToDisplayableItem(item: ItemResponse | undefined): DisplaybeItem|null {
    if (item === undefined)
      return null;

    return {
      itemId: item.id,
      name: item.name,
      desciption: item.description,
      chatLink: item.chat_link,
      icon: item.icon
    }
  }

  private equippedBagToInventoryBag(bag: Bag, characterName: string, bagInfo: ItemResponse|undefined): InventoryBag {
    return {
      itemId: bag.id,
      name: bagInfo?.name ?? '',
      desciption: bagInfo?.description ?? '',
      chatLink: bagInfo?.chat_link ?? '',
      icon: bagInfo?.icon ?? '',
      totalSlots: bag.size,
      usedSlots: bag.inventory.filter(item => item != null).length,
      boundTo: (bagInfo?.flags
                ? this.includesOneOf(bagInfo.flags, 'AccountBindOnUse', 'AccountBound')
                  ? 'Account'
                  : this.includesOneOf(bagInfo.flags, 'SoulbindOnAcquire', 'SoulBindOnUse')
                    ? characterName
                    : ''
                : ''
               )
    }
  }

  private includesOneOf<T>(array: T[], ...elems: T[]): boolean {
    for (const elem of elems) {
      if (array.includes(elem))
        return true;
    }
    return false;
  }

  private async lookupItemId(id: number): Promise<ItemResponse|undefined> {
    const item = await this.lookupItemIds([id]);
    if (item.length === 1)
      return item[0]
    else
      return undefined;
  }

  /**
   * Fetches item details from the GW2 api
   * @param ids item ids to lookup
   * @returns array of details of the requested items
   */
  private async lookupItemIds(ids: number[]): Promise<ItemResponse[]> {
    // The endpoint is limited to 200 ids at once
    const limit = 200;

    if (ids.length <= limit) {
      // TODO: add localization support (&lang=de)
      return await (await fetch(`${this.gw2ApiBase}/items?ids=${ids}`)).json() ?? [];
    } else {
      const chunks = [...Array(Math.ceil(ids.length / limit))].map(_ => ids.splice(0, limit));
      
      var res: ItemResponse[] = [];
      for (const chunk of chunks) {
        res = res.concat(await this.lookupItemIds(chunk));
      }
      
      return res;
    }
  }

  private addUnusedBag(bag: InventoryBag, location: string) {
    this.unusedBags.update(old => [
      ...old,
      {
        bag: bag,
        location: location
      }
    ]);
  }

  private addCharacter(name: string, profession: string, level: number, equippedBags: (InventoryBag | null)[], jadebotPowerCore: DisplaybeItem|null, jadebotSensoryArray: DisplaybeItem|null, jadebotServiceChip: DisplaybeItem|null) {
    this.characters.update(old => [
      ...old,
      new MyCharacterInfo(name, profession, level, equippedBags, jadebotPowerCore, jadebotSensoryArray, jadebotServiceChip)
    ]);
  }
}

// GW2 API response structures
type ItemDetails = BagDetails | UnlockDetails

interface BagDetails {
  tag: "bag";
  size: number;
  no_sell_or_sort: boolean;
}

interface UnlockDetails {
  tag: "unlock";
  type: string;
  unlock_type: string;
}

interface ItemResponse {
  id: number;
  name: string;
  description: string;
  type: string;
  chat_link: string;
  icon: string;
  flags: string[];
  details: BagDetails | undefined;
}

interface SharedInventoryItemResponse {
  id: number;
  count: number;
  binding: string|undefined;
}

interface BankResponse {
  id: number;
  count: number;
  binding: string|undefined;
  bound_to: string|undefined;
}


// GW2 APi response structure: truthy
interface Character {
  name: string;
  race: string;
  gender: string;
  profession: string;
  level: number;
  guild: string | undefined;
  age: number;
  last_modified: string | undefined;
  created: string;
  deaths: number;
  title: number | undefined;
  build_tabs_unlocked: number | undefined;
  active_build_tab: number | undefined;
  equipment_tabs_unlocked: number | undefined;
  active_equipment_tab: number | undefined;
  build_tabs: BuildTab[] | undefined;
  equipment: Equipment[];
  equipment_tabs: EquipmentTab[] | undefined;
  bags: (Bag | null)[] | undefined;
}

interface BuildTab {
  tab: number;
  is_active: boolean;
  build: {
    name: string;
    profession: string;
    specializations: Specialization[];
    skills: Skills;
    aquatic_skills: Skills;
    legends: [string | null, string | null] | undefined;
    aquatic_legends: [string | null, string | null] | undefined;
    pets: Pets | undefined;
  };
}

interface Specialization {
  id: number | null;
  traits: [number | null, number | null, number | null];
}

interface Skills {
  heal: number | null;
  utilities: [number | null, number | null, number | null];
  elite: number | null;
}

interface Pets {
  terrestrial: [number | null, number | null];
  aquatic: [number | null, number | null];
}

interface Equipment {
  id: number;
  count: number | undefined;
  slot: "HelmAquatic"
      | "Backpack"
      | "Coat"
      | "Boots"
      | "Gloves"
      | "Helm"
      | "Leggings"
      | "Shoulders"
      | "Accessory1"
      | "Accessory2"
      | "Ring1"
      | "Ring2"
      | "Amulet"
      | "WeaponAquaticA"
      | "WeaponAquaticB"
      | "WeaponA1"
      | "WeaponA2"
      | "WeaponB1"
      | "WeaponB2"
      | "Sickle"
      | "Axe"
      | "Pick"
      | "PowerCore"
      | "FishingLure"
      | "FishingBait"
      | "FishingRod"
      | "SensoryArray"
      | "ServiceChip"
      | undefined;
  infusions: number[] | undefined;
  upgrades: number[] | undefined;
  skin: number | undefined;
  stats: ItemStats | undefined;
  binding: "Character" | "Account" | undefined;
  location: "Equipped" | "Armory" | "EquippedFromLegendaryArmory" | "LegendaryArmory" | undefined;
  tabs: number[] | undefined;
  charges: number[] | undefined;
  bound_to: string | undefined;
  dyes: (number | null)[];
}

interface ItemStats {
  id: number;
  attributes: {
    BoonDuration: number | undefined;
    ConditionDamage: number | undefined;
    ConditionDuration: number | undefined;
    CritDamage: number | undefined;
    Healing: number | undefined;
    Power: number | undefined;
    Precision: number | undefined;
    Toughness: number | undefined;
    Vitality: number | undefined;
  };
}

interface EquipmentTab {
  tab: number;
  name: string;
  is_active: boolean;
  equipment: Equipment[];
  equipment_pvp: {
    amulet: number;
    rune: number;
    sigills: (number | null)[];
  }
}

interface Bag {
  id: number;
  size: number;
  inventory: (InventorySlot | null)[];
}

interface InventorySlot {
  id: number;
  count: number;
  charges: number | undefined;
  infusions: number[] | undefined;
  upgrades: number[] | undefined;
  skin: number | undefined;
  stats: ItemStats | undefined;
  dyes: (number | null)[] | undefined;
  binding: "Account" | "Character" | undefined;
  bound_to: string | undefined;
}




// TODO: remove?
// https://wiki.guildwars2.com/wiki/API:2/items
interface _Item {
  id: number;
  chat_link: string;
  name: string;
  icon: string | undefined;
  description: string | undefined;
  type: "Bag" | "Consumable";
  rarity: string;
  level: number;
  vendor_value: number;
  default_skin: number | undefined;
  flags: string[];
  game_types: string[];
  restrictions: [];
  upgrades_into: {upgrade: string; item_id: number}[];
  upgrades_from: {upgrade: string; item_id: number}[];
  details: _BagDetails | _ConsumableDetails | undefined;
}

interface _BagDetails {
  tag: "Bag";
  size: number;
  no_sell_or_sort: boolean;
}

interface _ConsumableDetails {
  tag: "Consumable";
  type: "Unlock";
  description: string | undefined;
  duration_ms: number | undefined;
  // present for Unlock types, which is what we are interested in
  unlock_type: "BagSlot"              // Bag Slot Expansion
             | "BankTab"              // Bank Tab Expansion
             | "BuildLibrarySlot"     // Build Storage Expansion
             | "BuildLoadoutTab"      // Build Template Expansion
             | "CollectibleCapacity"  // Storage Expander
             | "Dye"                  // Dyes
             | "GearLoadoutTab"       // Equipment Template Expansion
             | "SharedSlot"           // Shared Inventory Slot
             | undefined;
  color_id: number | undefined;
  recipe_id: number | undefined;
  extra_recipe_ids: number[] | undefined;
  guild_upgrade_id: number | undefined;
  apply_count: number | undefined;
  name: string | undefined;
  icon: string | undefined;
  skins: number[] | undefined;
}