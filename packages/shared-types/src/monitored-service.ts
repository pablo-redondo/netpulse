import { CheckType } from './check-type';

export interface MonitoredService {
  id: string;
  name: string;
  type: CheckType;
  target: string;
  vlanGroup: string | null;
  isActive: boolean;
  createdAt: string;
}
