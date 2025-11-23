import { Injectable } from '@angular/core';
import { CharacterInfo, MyCharacterInfo } from './characterInfo';

@Injectable({
  providedIn: 'root',
})
export class BagsService {
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
}
