import { Injectable, signal } from '@angular/core';
import { CharacterInfo, MyCharacterInfo } from './characterInfo';
import { InventoryBag } from './inventoryBag';

@Injectable({
  providedIn: 'root',
})
export class BagsService {
  private readonly gw2ApiBase = 'https://api.guildwars2.com/v2';

  // https://wiki.guildwars2.com/wiki/API:Main
  public readonly requiredApiKeyPermissions = ['account','characters', 'inventories'];

  private apiKey: TokenInfo = {
    accessToken: '',
    permissions: []
  };

  public apiAccessToken(): string { return this.apiKey.accessToken }
  public apiPermissions(): string[] { return this.apiKey.permissions }

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

  async populateEquippedCharacterBags() {
    if (this.checkAccessTokenPermissions(['account', 'characters'])) {
      const data: Promise<Character[]> = (await fetch(`${this.gw2ApiBase}/characters?ids=all&v=latest&access_token=${this.apiKey.accessToken}`)).json() ?? [];
      const characters: Character[] = await data;

      characters.forEach(character =>
        this.unusedCharacterInventoryBags(
          (character.bags ?? []).flatMap(x => x?.inventory)
                                .filter(x => x !== null && x !== undefined)
        ).then(bags =>
          bags.forEach(bag => this.addUnusedBag(bag, character.name))
        )
      );

      characters.forEach(character => 
        this.equippedBags(character.name, character.bags ?? [])
            .then(bags => this.addCharacter(character.name, character.profession, character.level, bags))
      );
    }
  }

  // TODO: unify unused bag functions
  async populateUnusedSharedInventoryBags() {
    if (this.checkAccessTokenPermissions(['account', 'inventories'])) {
      const data: (SharedInventoryItemResponse|null)[] = await ((await fetch(`${this.gw2ApiBase}/account/inventory?access_token=${this.apiKey.accessToken}`))).json() ?? [];
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
    if (this.checkAccessTokenPermissions(['account', 'inventories'])) {
      const data: (BankResponse|null)[] = await (await fetch(`${this.gw2ApiBase}/account/bank?access_token=${this.apiKey.accessToken}`)).json() ?? [];
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

  /**
   * Sets a new access token to the GW2 api and retrieves data from the api
   * @param accessToken the new access token for the GW2 api
   * @returns true if a new access token has been set, false otherwise
   */
  async applyGW2ApiAccessToken(accessToken: string): Promise<boolean> {
    // Return if trying to apply the same access token again
    if (accessToken === this.apiKey.accessToken)
      return true;

    const data: Promise<{permissions: string[]}> = (await fetch(`${this.gw2ApiBase}/tokeninfo?access_token=${accessToken}`)).json();
    const permissions = (await data).permissions ?? [];

    // valid api keys at least include the 'account' permission
    if (permissions.includes('account')) {
      // Remove old data
      this.unusedBags.set([]);
      this.characters.set([]);

      // Set new api key
      this.apiKey = {
        accessToken: accessToken,
        permissions: permissions
      };
      localStorage.setItem('apiKey', accessToken);

      // Retrieve information from the api
      this.populateEquippedCharacterBags();
      this.populateUnusedSharedInventoryBags();
      this.populateUnusedBankBags();

      return this.requiredApiKeyPermissions.every(x => this.apiKey.permissions.includes(x));
    }

    return false;
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

  private addCharacter(name: string, profession: string, level: number, equippedBags: (InventoryBag | null)[]) {
    this.characters.update(old => [
      ...old,
      new MyCharacterInfo(name, profession, level, equippedBags)
    ]);
  }

  private checkAccessTokenPermissions(wanted: string[]): boolean {
    return wanted.every(x => this.apiKey.permissions.includes(x));
  }
}

// GW2 API response structures
interface TokenInfo {
  accessToken: string;
  permissions: string[];
}

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