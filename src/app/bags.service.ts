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

  private unusedBags: InventoryBag[] = [];

  // bags of chars (including char inventories)
  // https://wiki.guildwars2.com/wiki/API:2/characters

  // bank
  // https://wiki.guildwars2.com/wiki/API:2/account/bank

  // shared inventory slots
  // https://wiki.guildwars2.com/wiki/API:2/account/inventory

  characters = signal<CharacterInfo[]>([
    new MyCharacterInfo(
      'Foo',
      'Ranger',
      80,
      [
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 8,
          boundTo: 'Foo',
          desciption: '',
          icon: 'https://render.guildwars2.com/file/119B6643B4B842BB0DDBE76122D865C2C595B326/433573.png',
          chatLink: '[&AgFfJQAA]'
        },
        {
          itemId: 0,
          name: 'LargeBag',
          totalSlots: 20,
          usedSlots: 13,
          boundTo: 'Foo',
          desciption: '',
          icon: '',
          chatLink: ''
        }
      ],
      0
    ),
    new MyCharacterInfo(
      'Bar',
      'Mesmer',
      80,
      [
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 8,
          boundTo: 'Bar',
          desciption: '',
          icon: '',
          chatLink: ''
        },
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 3,
          boundTo: 'Bar',
          desciption: '',
          icon: '',
          chatLink: ''
        },
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 7,
          boundTo: 'Bar',
          desciption: '',
          icon: '',
          chatLink: ''
        },
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 9,
          boundTo: 'Bar',
          desciption: '',
          icon: '',
          chatLink: ''
        },
      ],
      0
    )
  ]);

  // TODO: rename (populate from gw2 api or something like that)
  async foo(): Promise<CharacterInventory[]> {
    if (this.apiKey.permissions.includes('characters')) {
      const data = await fetch(`${this.gw2ApiBase}/characters?ids=all&access_token=${this.apiKey.accessToken}`);
      return (await data.json()) ?? [];
    }

    return [];
  }

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

  private async populateEquippedBags(bags: (BagResponse|null)[], characterName: string): Promise<InventoryBag[]> {
    const actualBags = bags.filter(bag => bag != null);
    const ids = actualBags.map(bag => bag.id);

    const bagInfos: ItemResponse[] = await (await fetch(`${this.gw2ApiBase}/items?ids=${ids}`)).json() ?? [];

    return actualBags.map(bag => this.bagResponseToInventoryBag(bag, characterName, bagInfos.find(item => item.id == bag.id)));
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

interface TokenInfo {
  accessToken: string;
  permissions: string[];
}

interface ItemResponse {
  id: number;
  name: string;
  description: string;
  type: string;
  chat_link: string;
  icon: string;
  flags: string[];
}

// TODO: remove export, make the api structure internal and parse into own structure
export interface Inventory {
  id: number;
  count: number;
  binding: string;
  bound_to: string | undefined;
}

export interface BagResponse {
  id: number;
  size: number;
  inventory: (Inventory | null)[]
}

export interface CharacterInventory {
  name: string;
  profession: string;
  level: number;
  bags: (BagResponse | null)[];
}