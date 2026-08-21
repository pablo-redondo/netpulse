import { CheckType } from '#prisma/client';

// Agrupacion ilustrativa por VLAN, usada solo por la vista de topologia
// (ver DESIGN.md, punto 5). No refleja segmentacion de red real.
const VLAN_WEB = 'VLAN 10 - Web (10.0.10.0/24)';
const VLAN_DNS = 'VLAN 20 - DNS (10.0.20.0/24)';
const VLAN_INFRA = 'VLAN 30 - Infra (10.0.30.0/24)';

export interface SeedService {
  name: string;
  type: CheckType;
  target: string;
  vlanGroup: string;
  expectedContent?: string;
}

// Catalogo unico de servicios publicos monitorizados. Compartido entre el
// seed de desarrollo (prisma/seed.ts) y el endpoint /admin/seed usado para
// sembrar produccion, para que nunca se desincronicen.
export const seedServices: SeedService[] = [
  // --- HTTP ---
  {
    name: 'GitHub',
    type: CheckType.HTTP,
    target: 'https://github.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Google',
    type: CheckType.HTTP,
    target: 'https://google.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Cloudflare',
    type: CheckType.HTTP,
    target: 'https://cloudflare.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'GitHub API',
    type: CheckType.HTTP,
    target: 'https://api.github.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Wikipedia',
    type: CheckType.HTTP,
    target: 'https://wikipedia.org',
    vlanGroup: VLAN_WEB,
    expectedContent: 'Wikipedia',
  },
  {
    name: 'DuckDuckGo',
    type: CheckType.HTTP,
    target: 'https://duckduckgo.com',
    vlanGroup: VLAN_WEB,
    expectedContent: 'DuckDuckGo',
  },
  {
    name: 'NPM Registry',
    type: CheckType.HTTP,
    target: 'https://registry.npmjs.org',
    vlanGroup: VLAN_WEB,
  },

  // --- DNS ---
  {
    name: 'Cloudflare DNS (1.1.1.1)',
    type: CheckType.DNS,
    target: 'github.com@1.1.1.1',
    vlanGroup: VLAN_DNS,
  },
  {
    name: 'Google DNS (8.8.8.8)',
    type: CheckType.DNS,
    target: 'google.com@8.8.8.8',
    vlanGroup: VLAN_DNS,
  },
  {
    name: 'Quad9 DNS (9.9.9.9)',
    type: CheckType.DNS,
    target: 'cloudflare.com@9.9.9.9',
    vlanGroup: VLAN_DNS,
  },
  {
    name: 'OpenDNS (208.67.222.222)',
    type: CheckType.DNS,
    target: 'github.com@208.67.222.222',
    vlanGroup: VLAN_DNS,
  },

  // --- TCP ---
  {
    name: 'GitHub TCP:443',
    type: CheckType.TCP,
    target: 'github.com:443',
    vlanGroup: VLAN_INFRA,
  },
  {
    name: 'Cloudflare DNS TCP:53',
    type: CheckType.TCP,
    target: '1.1.1.1:53',
    vlanGroup: VLAN_INFRA,
  },
  {
    name: 'Gmail SMTP TCP:587',
    type: CheckType.TCP,
    target: 'smtp.gmail.com:587',
    vlanGroup: VLAN_INFRA,
  },
  {
    name: 'Discord TCP:443',
    type: CheckType.TCP,
    target: 'discord.com:443',
    vlanGroup: VLAN_INFRA,
  },

  // --- TLS (expiración de certificado) ---
  {
    name: 'Cloudflare TLS',
    type: CheckType.TLS,
    target: 'cloudflare.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'GitHub TLS',
    type: CheckType.TLS,
    target: 'github.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Google TLS',
    type: CheckType.TLS,
    target: 'google.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Docker Hub TLS',
    type: CheckType.TLS,
    target: 'registry-1.docker.io',
    vlanGroup: VLAN_INFRA,
  },
];
