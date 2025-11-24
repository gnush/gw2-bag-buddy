import { Injectable } from '@angular/core';
import { CharacterInfo, MyCharacterInfo } from './characterInfo';

@Injectable({
  providedIn: 'root',
})
export class BagsService {
  // https://wiki.guildwars2.com/wiki/API:Main
  public requiredApiKeyPermissions = ['account','characters', 'inventories'];

  private apiKey: TokenInfo = {
    accessToken: '',
    permissions: []
  };

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

  // TODO: check gw2 api for character inventories/bags

  /**
   * Sets a new access token to the GW2 api
   * @param accessToken the new access token for the GW2 api
   * @returns The missing permissions of the supplied access token
   */
  async setGW2ApiAccessToken(accessToken: string): Promise<string[]> {
    const data: Promise<{permissions: string[]}> = (await fetch(`https://api.guildwars2.com/v2/tokeninfo?access_token=${accessToken}`)).json();
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