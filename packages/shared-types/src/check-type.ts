export const CheckType = {
  HTTP: 'HTTP',
  DNS: 'DNS',
  TCP: 'TCP',
  TLS: 'TLS',
} as const;

export type CheckType = (typeof CheckType)[keyof typeof CheckType];
