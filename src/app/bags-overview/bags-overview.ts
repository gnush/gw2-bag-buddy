import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BagsService, CharacterInventory } from '../bags.service';
import { BagCell } from '../bag-cell/bag-cell';

@Component({
  selector: 'app-bags-overview',
  imports: [BagCell, ReactiveFormsModule],
  templateUrl: './bags-overview.html',
  styleUrl: './bags-overview.css',
})
export class BagsOverview {
  showApiKeyInfo = false;

  apiKeyForm = new FormGroup({
    apiKey: new FormControl('', Validators.required)
  });

  bagsService = inject(BagsService);

  missingPermissions: WritableSignal<string[]> = signal(this.bagsService.requiredApiKeyPermissions);

  chars: WritableSignal<CharacterInventory[]> = signal([]);

  constructor() {
    this.apiKeyForm.setValue({apiKey: localStorage.getItem('apiKey') ?? ''});
    
    this.applyApiKey();
  }

  applyApiKey() {
    this.bagsService.setGW2ApiAccessToken(this.apiKeyForm.value.apiKey ?? '').then(permissions => {
      this.missingPermissions.set(permissions);
      
      this.bagsService.populateBagInformation();

      this.bagsService.foo().then(chars => {
        this.chars.set(chars);
      });
    });
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }

  occupied(
    inventory: ({
      id: number;
      count: number;
      binding: string;
      bound_to: string | undefined;
    } | null)[]
  ): number {
    return inventory.filter(item => item != null).length;
  }

  totalInventorySlots(char: CharacterInventory): number {
    return char.bags.reduce((size, bag) => size + (bag != null ? bag.size : 0), 0);
  }

  occupiedInventorySlots(char: CharacterInventory): number {
    return char.bags.reduce((size, bag) => size + (bag != null ? bag.inventory.filter(item => item != null).length : 0), 0);
  }

  bags(char: CharacterInventory): string {
    return char.bags.reduceRight((acc, bag) => `${bag != null ? bag.id : ''} ${acc}`, '');
  }

  emptyBags(char: CharacterInventory): number {
    return char.bags.filter(bag => bag == null).length;
  }
}
