export interface TreeOption {
  value: string;
  label: string;
  icon?: string;
  children?: TreeOption[];
  disabled?: boolean;
}
export interface TransferItem {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}
