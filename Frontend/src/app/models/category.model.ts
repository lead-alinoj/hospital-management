export interface Category {
  _id?: string;
  name: string;
type: 'Medicine' | 'Equipment' | 'Consumable' | 'Cleaning';
  createdAt?: Date;
  updatedAt?: Date;
}
