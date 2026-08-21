import { CheckType } from './check-type';

export interface MonitoredService {
  id: string;
  name: string;
  type: CheckType;
  target: string;
  vlanGroup: string | null;
  /** Solo para HTTP: texto que debe aparecer en el body para que el check pase. */
  expectedContent: string | null;
  isActive: boolean;
  createdAt: string;
}
