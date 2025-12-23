export class ListAdCampaignsDto {
  accessToken: string;
  adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }
}