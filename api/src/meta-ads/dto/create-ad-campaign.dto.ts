export class CreateAdCampaignDto {
  name: string;
  objective: string;
  status: string;

  constructor(name: string, objective: string, status: string) {
    this.name = name;
    this.objective = objective;
    this.status = status;
  }
}