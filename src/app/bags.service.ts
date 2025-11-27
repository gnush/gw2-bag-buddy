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

  // TODO: export signal captured type to interface
  private unusedBags = signal<{bag: InventoryBag; location: string}[]>([]);
  public getUnusedBags() { return this.unusedBags() }

  private characters = signal<CharacterInfo[]>([]);
  public getCharacters() { return this.characters() }

  async populateEquippedCharacterBags() {
    if (this.checkAccessTokenPermissions(['account', 'characters'])) {
      const data: Promise<CharacterInventory[]> = (await fetch(`${this.gw2ApiBase}/characters?ids=all&access_token=${this.apiKey.accessToken}`)).json() ?? [];
      const characters: CharacterInventory[] = await data;

      characters.forEach(character =>
        this.populateUnusedCharacterInventoryBags(
          character.name,
          character.bags.flatMap(bag => bag?.inventory)
                        .filter(item => item != null)
        )
      );

      for (const character of characters) {
        const bags = await this.populateEquippedBags(character.bags, character.name);

        this.characters.update(old =>
          [
            ...old,
            new MyCharacterInfo(
              character.name,
              character.profession,
              character.level,
              bags
            )
          ]
        );
      }
    }
  }

  // TODO: unify unused bag functions
  private async populateUnusedCharacterInventoryBags(character: string, inventory: Inventory[]) {
    const itemInfos = await this.lookupItemIds(inventory.map(item => item.id));

    inventory.forEach(inventoryItem => {
      const info = itemInfos.find(item => item.id === inventoryItem.id);
      if (info !== undefined) {
        const bag = this.itemResponseToInventoryBag(
          info,
          inventoryItem.binding === 'AccountBound' ? inventoryItem.binding : inventoryItem.bound_to
        );
        if (bag != null) {
          this.unusedBags.update(old =>
            [
              ...old,
              {
                bag: bag,
                location: character
              }
            ]
          );
        }
      }
    });
  }

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
    if (this.checkAccessTokenPermissions(['account', 'inventories'])) {
      const data: (BankResponse|null)[] = await (await fetch(`${this.gw2ApiBase}/account/bank?access_token=${this.apiKey.accessToken}`)).json() ?? [];
      const bankContent: BankResponse[] = data.filter(item => item != null);

      const items: ItemResponse[] = await this.lookupItemIds(bankContent.map(item => item.id));

      for (const bankItem of bankContent) {
        const itemInfo = items.find(item => item.id === bankItem.id);

        if (itemInfo != undefined) {
          const bag = this.itemResponseToInventoryBag(
            itemInfo,
            bankItem.binding === 'AccountBound' ? bankItem.binding : bankItem.bound_to
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

  private async populateEquippedBags(bags: (BagResponse|null)[], characterName: string): Promise<(InventoryBag|null)[]> {
    const actualBags = bags.filter(bag => bag != null);
    const ids = actualBags.map(bag => bag.id);
    const bagInfos: ItemResponse[] = await this.lookupItemIds(ids);

    return bags.map(bag =>
      bag !== null ?
        this.bagResponseToInventoryBag(bag, characterName, bagInfos.find(item => item.id == bag.id)) :
        null
    );
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

  private checkAccessTokenPermissions(wanted: string[]): boolean {
    return wanted.every(x => this.apiKey.permissions.includes(x));
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

// rename InventoryItem
interface Inventory {
  id: number;
  count: number;
  binding: string | undefined;
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

// TODO: merge with Inventory
interface BankResponse {
  id: number;
  count: number;
  binding: string|undefined;
  bound_to: string|undefined;
}