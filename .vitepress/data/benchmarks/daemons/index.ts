import calagopus from './calagopus/index.ts';
import pelican from './pelican/index.ts';
import pterodactyl from './pterodactyl/index.ts';

export const daemons = { calagopus, pelican, pterodactyl } as const;

export type DaemonId = keyof typeof daemons;
export const daemonIds = Object.keys(daemons) as DaemonId[];
