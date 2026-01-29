import { Component, inject} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiKeySettings } from "../api-key-settings/api-key-settings";
import { BagsOverview } from "../bags-overview/bags-overview";
import { JadebotOverview } from "../jadebot-overview/jadebot-overview";
import { ApiKeyService } from "../apiKey.service";

// Since github pages doesn't allow for path navigation (afaik)
@Component({
  selector: 'app-navigatable-home',
  imports: [ApiKeySettings, BagsOverview, JadebotOverview],
  templateUrl: './navigatable-home.html',
  styleUrl: './navigatable-home.css'
})
export class NavigatableHome {
  apiKeyService = inject(ApiKeyService);
  routeParam = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.routeParam = params.get('route') ?? '';
    });
  }
}