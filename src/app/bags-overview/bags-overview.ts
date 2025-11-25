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
}
