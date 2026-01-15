export interface Package {
  _id?: string;
  name: string;
  price: number;
  description?: string;
  features?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
