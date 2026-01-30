import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { BagsService} from '../bags.service';
import { EquippedBag } from '../equipped-bag/equipped-bag';
import { UnusedBag } from '../unused-bag/unused-bag';
import { EmptyBagSlot } from '../empty-bag-slot/empty-bag-slot';
import { CharacterDisplay } from '../character-display/character-display';

// TODO:
//   - split char table and unused bags to new components
//   - move api key input form to separate component
//   - api key input form as it's own page
@Component({
  selector: 'app-bags-overview',
  imports: [CharacterDisplay, EmptyBagSlot, EquippedBag, UnusedBag],
  templateUrl: './bags-overview.html',
  styleUrl: './bags-overview.css',
})
export class BagsOverview {
  bagsService = inject(BagsService);

  constructor() {
    effect(() => this.bagsService.repopulateBags());
  }
}
