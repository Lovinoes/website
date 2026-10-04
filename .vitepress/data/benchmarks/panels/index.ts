import calagopus from './calagopus/index.ts';
import featherpanel from './featherpanel/index.ts';
import hydrodactyl from './hydrodactyl/index.ts';
import pelican from './pelican/index.ts';
import pterodactyl from './pterodactyl/index.ts';
import pufferpanel from './pufferpanel/index.ts';

export const panels = { calagopus, featherpanel, hydrodactyl, pelican, pterodactyl, pufferpanel } as const;

export type PanelId = keyof typeof panels;
export const panelIds = Object.keys(panels) as PanelId[];
