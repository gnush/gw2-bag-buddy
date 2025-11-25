import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BagsService} from '../bags.service';
import { BagCell } from '../bag-cell/bag-cell';
import { UnusedBagCell } from '../unused-bag-cell/unused-bag-cell';

@Component({
  selector: 'app-bags-overview',
  imports: [BagCell, ReactiveFormsModule, UnusedBagCell],
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
    });
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
