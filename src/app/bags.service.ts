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

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkApiKey(): Promise<string> {
    const data: Promise<TokenInfo> = (await fetch(`https://api.guildwars2.com/v2/tokeninfo?access_token=${this.apiKey}`)).json();

    const permissions: string[] = (await data).permissions ?? [];

    var missingRequirements: string[] = [];

    this.requiredApiKeyPermissions.forEach(permission => {
      if (!permissions.includes(permission))
        missingRequirements.push(permission);
    });

    if (missingRequirements.length === 0)
      return 'All requirements met';
    else if (missingRequirements.length === 1)
      return `Missing '${missingRequirements}' permsission`;
    else
      return `Missing '${missingRequirements}' permsissions`;
  }
}

interface TokenInfo {
  permissions: string[];
}