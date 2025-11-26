import { Injectable, signal } from '@angular/core';
import { CharacterInfo, MyCharacterInfo } from './characterInfo';
import { InventoryBag } from './inventoryBag';

@Injectable({
  providedIn: 'root',
})
export class BagsService {
  private readonly gw2ApiBase = 'https://api.guildwars2.com/v2';

  // https://wiki.guildwars2.com/wiki/API:Main
  public requiredApiKeyPermissions = ['account','characters', 'inventories'];

  private apiKey: TokenInfo = {
    accessToken: '',
    permissions: []
  };

  // TODO: export type to interface
  unusedBags = signal<{bag: InventoryBag; location: string}[]>([]);

  // bags of chars (including char inventories)
  // https://wiki.guildwars2.com/wiki/API:2/characters

  // bank
  // https://wiki.guildwars2.com/wiki/API:2/account/bank

  // shared inventory slots
  // https://wiki.guildwars2.com/wiki/API:2/account/inventory

  characters = signal<CharacterInfo[]>([]);

  async populateBagInformation() {
    if (this.apiKey.permissions.includes('characters')) {
      const data: Promise<CharacterInventory[]> = (await fetch(`${this.gw2ApiBase}/characters?ids=all&access_token=${this.apiKey.accessToken}`)).json() ?? [];
      const characters: CharacterInventory[] = await data;
      
      for (const character of characters) {
        const bags = await this.populateEquippedBags(character.bags, character.name);

        this.characters.update(old =>
          [
            ...old,
            new MyCharacterInfo(
              character.name,
              character.profession,
              character.level,
              bags,
              character.bags.filter(bag => bag == null).length
            )
          ]
        );
      }
    }
  }

  async populateUnusedSharedInventoryBags() {
    if (this.apiKey.permissions.includes('inventories')) {
      const data: (SharedInventoryItemResponse|null)[] = await ((await fetch(`${this.gw2ApiBase}/account/inventory?access_token=${this.apiKey.accessToken}`))).json() ?? [];
      const sharedInventory: SharedInventoryItemResponse[] = data.filter(item => item != null);

      const items: ItemResponse[] = (await this.lookupItemIds(
        sharedInventory.map(item => item.id)
      ));

      for (const sharedInventoryItem of sharedInventory) {
        const itemResponse = items.find(item => item.id === sharedInventoryItem.id);
        if (itemResponse !== undefined) {
          const bag = this.itemResponseToInventoryBag(itemResponse, sharedInventoryItem.binding);
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
    if (this.apiKey.permissions.includes('inventories')) {
      const data: (BankResponse|null)[] = await (await fetch(`${this.gw2ApiBase}/account/bank?access_token=${this.apiKey.accessToken}`)).json() ?? [];
      const bankContent: BankResponse[] = data.filter(item => item != null);

      const items: ItemResponse[] = await this.lookupItemIds(bankContent.map(item => item.id));

      for (const bankItem of bankContent) {
        const itemInfo = items.find(item => item.id === bankItem.id);

        if (itemInfo != undefined) {
          const bag = this.itemResponseToInventoryBag(itemInfo, bankItem.binding);
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

  private async populateEquippedBags(bags: (BagResponse|null)[], characterName: string): Promise<InventoryBag[]> {
    const actualBags = bags.filter(bag => bag != null);
    const ids = actualBags.map(bag => bag.id);
    const bagInfos: ItemResponse[] = await this.lookupItemIds(ids);

    return actualBags.map(bag => this.bagResponseToInventoryBag(bag, characterName, bagInfos.find(item => item.id == bag.id)));
  }

  private itemResponseToInventoryBag(item: ItemResponse, binding: string|undefined): InventoryBag|null {
    if (item.type !== 'Bag')
      return null;
      
    return {
      itemId: item.id,
      name: item.name,
      desciption: item.description,
      chatLink: item.chat_link,
      icon: item.icon,
      totalSlots: item.details?.size ?? 0,
      usedSlots: 0,
      boundTo: binding ?? ''
    }
  }

  private bagResponseToInventoryBag(bag: BagResponse, characterName: string, bagInfo: ItemResponse|undefined): InventoryBag {
    return {
      itemId: bag.id,
      name: bagInfo?.name ?? '',
      desciption: bagInfo?.description ?? '',
      chatLink: bagInfo?.chat_link ?? '',
      icon: bagInfo?.icon ?? '',
      totalSlots: bag.size,
      usedSlots: bag.inventory.filter(item => item != null).length,
      boundTo: (bagInfo?.flags.includes('AccountBound') ? 'Account' : characterName)
    }
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
   * Sets a new access token to the GW2 api
   * @param accessToken the new access token for the GW2 api
   * @returns The missing permissions of the supplied access token
   */
  async setGW2ApiAccessToken(accessToken: string): Promise<string[]> {
    const data: Promise<{permissions: string[]}> = (await fetch(`${this.gw2ApiBase}/tokeninfo?access_token=${accessToken}`)).json();
    const permissions = (await data).permissions ?? [];
    const missingPermissions = await this.validatePermissions(permissions);

    if (missingPermissions.length === 0) {
      this.apiKey = {
        accessToken: accessToken,
        permissions: permissions
      };
      localStorage.setItem('apiKey', accessToken);
    }

    return missingPermissions;
  }

  private async validatePermissions(permissions: string[]): Promise<string[]> {
    var missingRequirements: string[] = [];

    this.requiredApiKeyPermissions.forEach(permission => {
      if (!permissions.includes(permission))
        missingRequirements.push(permission);
    });

    return missingRequirements;
  }

  private checkAccessTokenPermission(wanted: string[]) {
    wanted.every(this.apiKey.permissions.includes);
  }
}

// GW2 API response structures
interface TokenInfo {
  accessToken: string;
  permissions: string[];
}

interface BagDetails {
  size: number;
  no_sell_or_sort: boolean;
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

interface Inventory {
  id: number;
  count: number;
  binding: string;
  bound_to: string | undefined;
}

interface BagResponse {
  id: number;
  size: number;
  inventory: (Inventory | null)[]
}

interface CharacterInventory {
  name: string;
  profession: string;
  level: number;
  bags: (BagResponse | null)[];
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