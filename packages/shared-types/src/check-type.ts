export const CheckType = {
  HTTP: 'HTTP',
  DNS: 'DNS',
  TCP: 'TCP',
  TLS: 'TLS',
  NTP: 'NTP',
} as const;

export type CheckType = (typeof CheckType)[keyof typeof CheckType];
