import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Configuracion por defecto del adaptador: sin cache incremental ni colas.
// El panel no usa ISR —todas las paginas son dinamicas y consultan la API en
// cada peticion (`cache: 'no-store'` en lib/api.ts)—, asi que no hay nada que
// cachear entre peticiones.
export default defineCloudflareConfig();
