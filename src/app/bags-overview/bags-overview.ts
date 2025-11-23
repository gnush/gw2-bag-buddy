import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BagsService } from '../bags.service';

@Component({
  selector: 'app-bags-overview',
  imports: [ReactiveFormsModule],
  templateUrl: './bags-overview.html',
  styleUrl: './bags-overview.css',
})
export class BagsOverview {
  showApiKeyInfo = false;

  apiKeyForm = new FormGroup({
    apiKey: new FormControl('', Validators.required)
  });

  bagsService = inject(BagsService);

  tokenInfo: WritableSignal<string> = signal('');

  applyApiKey() {
    this.bagsService.setApiKey(this.apiKeyForm.value.apiKey ?? '');
    
    this.bagsService.checkApiKey().then((s) => {
      this.tokenInfo.set(s);
    });
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
