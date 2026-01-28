import { Injectable, signal, WritableSignal } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ApiKeyService {
  private readonly gw2ApiBase = 'https://api.guildwars2.com/v2';

  // https://wiki.guildwars2.com/wiki/API:Main
  public readonly requiredApiKeyPermissions = ['account','characters', 'inventories'];

  private accessToken = signal('');
  private permissions: WritableSignal<string[]> = signal([]);

  constructor()  {
    const accessToken = localStorage.getItem('apiKey');
    if (accessToken != null) {
      this.setGW2ApiAccessToken(accessToken);
    }
  }

  public apiAccessToken(): string { return this.accessToken() }
  public apiPermissions(): string[] { return this.permissions() }

  public checkAccessTokenPermissions(wanted: string[]): boolean {
    return wanted.every(x => this.permissions().includes(x));
  }

  /**
   * Sets a new access token to the GW2 api and retrieves data from the api
   * @param accessToken the new access token for the GW2 api
   * @returns true if a new access token has been set, false otherwise
   */
  public async setGW2ApiAccessToken(accessToken: string): Promise<boolean> {
    // Return if trying to apply the same access token again
    if (accessToken === this.accessToken())
      return false;

    const data: Promise<{permissions: string[]}> = (await fetch(`${this.gw2ApiBase}/tokeninfo?access_token=${accessToken}`)).json();
    const permissions = (await data).permissions ?? [];

    // valid api keys at least include the 'account' permission
    if (permissions.includes('account')) {
      // Set new api key
      this.accessToken.set(accessToken);
      this.permissions.set(permissions);
      localStorage.setItem('apiKey', accessToken);

      // transports if all permissions are met
      //return this.requiredApiKeyPermissions.every(x => this.apiKey.permissions.includes(x));
      return true;
    }

    return false;
  }
}