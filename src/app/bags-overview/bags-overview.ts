import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BagsService} from '../bags.service';
import { EquippedBag } from '../equipped-bag/equipped-bag';
import { UnusedBag } from '../unused-bag/unused-bag';
import { EmptyBagSlot } from '../empty-bag-slot/empty-bag-slot';
import { ApiKeyService } from '../apiKey.service';

// TODO: split char table and unused bags to new components
@Component({
  selector: 'app-bags-overview',
  imports: [EmptyBagSlot, EquippedBag, ReactiveFormsModule, UnusedBag],
  templateUrl: './bags-overview.html',
  styleUrl: './bags-overview.css',
})
export class BagsOverview {
  showApiKeyInfo = false;

  apiKeyForm = new FormGroup({
    apiKey: new FormControl('', Validators.required)
  });

  apiKeyService = inject(ApiKeyService);
  bagsService = inject(BagsService);

  constructor() {
    this.apiKeyForm.setValue({apiKey: localStorage.getItem('apiKey') ?? ''});
    
    this.applyApiKey();
  }

  applyApiKey() {
    this.apiKeyService.setGW2ApiAccessToken(this.apiKeyForm.value.apiKey ?? '').then(success => {
      this.showApiKeyInfo = !success;

      this.bagsService.repopulateBags();
    });
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
