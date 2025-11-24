import { Injectable } from '@angular/core';
import { CharacterInfo, MyCharacterInfo } from './characterInfo';

@Injectable({
  providedIn: 'root',
})
export class BagsService {
  private apiKey: string = '';

  // https://wiki.guildwars2.com/wiki/API:Main
  public requiredApiKeyPermissions = ['account','characters', 'inventories'];

  // bags of chars (including char inventories)
  // https://wiki.guildwars2.com/wiki/API:2/characters

  // bank
  // https://wiki.guildwars2.com/wiki/API:2/account/bank

  // shared inventory slots
  // https://wiki.guildwars2.com/wiki/API:2/account/inventory

  private characters: MyCharacterInfo[] = [
    new MyCharacterInfo(
      0,
      'Foo',
      [
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 8,
          boundTo: 'Foo'
        },
        {
          itemId: 0,
          name: 'LargeBag',
          totalSlots: 20,
          usedSlots: 13,
          boundTo: 'Foo'
        }
      ]
    ),
    new MyCharacterInfo(
      1,
      'Bar',
      [
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 8,
          boundTo: 'Bar'
        },
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 3,
          boundTo: 'Bar'
        },
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 7,
          boundTo: 'Bar'
        },
        {
          itemId: 0,
          name: 'Bag',
          totalSlots: 10,
          usedSlots: 9,
          boundTo: 'Bar'
        },
      ]
    )
  ];

  allCharacters(): CharacterInfo[] {
    return this.characters;
  }

  /**
   * Sets a new api key
   * @param apiKey the new api key
   * @returns The missing permissions of the supplied api key
   */
  async setApiKey(apiKey: string): Promise<string[]> {
    const missingPermissions = await this.validateAccessToken(apiKey);

    if (missingPermissions.length === 0) {
      this.apiKey = apiKey;
      localStorage.setItem('apiKey', apiKey);
    }

    return missingPermissions;
  }

  private async validateAccessToken(apiKey: string): Promise<string[]> {
    const data: Promise<TokenInfo> = (await fetch(`https://api.guildwars2.com/v2/tokeninfo?access_token=${apiKey}`)).json();

    const permissions = (await data).permissions ?? [];

    var missingRequirements: string[] = [];

    this.requiredApiKeyPermissions.forEach(permission => {
      if (!permissions.includes(permission))
        missingRequirements.push(permission);
    });

    return missingRequirements;
  }
}

interface TokenInfo {
  permissions: string[];
}