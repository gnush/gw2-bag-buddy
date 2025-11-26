import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BagsService} from '../bags.service';
import { EquippedBag } from '../equipped-bag/equipped-bag';
import { UnusedBag } from '../unused-bag/unused-bag';

@Component({
  selector: 'app-bags-overview',
  imports: [EquippedBag, ReactiveFormsModule, UnusedBag],
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

  constructor() {
    this.apiKeyForm.setValue({apiKey: localStorage.getItem('apiKey') ?? ''});
    
    this.applyApiKey();
  }

  applyApiKey() {
    this.bagsService.setGW2ApiAccessToken(this.apiKeyForm.value.apiKey ?? '').then(permissions => {
      this.missingPermissions.set(permissions);
      
      // move to bagService
      this.bagsService.populateBagInformation();
      this.bagsService.populateUnusedSharedInventoryBags();
      this.bagsService.populateUnusedBankBags();
    });
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
