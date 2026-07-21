export interface SystemInfo {
  id: string;
  shortName: string;
  name: string;
  cpu: string;
  ram: string;
}

export const systems: SystemInfo[] = [
  {
    id: 'ryzen-9900x',
    shortName: '9900X',
    name: 'Ryzen 9 9900X',
    cpu: 'AMD Ryzen 9 9900X',
    ram: 'DDR5-6000',
  },
  {
    id: 'epyc-7443p',
    shortName: 'EPYC 7443P',
    name: 'EPYC 7443P',
    cpu: 'AMD EPYC 7443P',
    ram: 'DDR4-2666',
  },
  {
    id: 'xeon-e5-2680v2',
    shortName: '2× E5-2680v2',
    name: '2× Xeon E5-2680 v2',
    cpu: '2× Intel Xeon E5-2680 v2',
    ram: 'DDR3-1600',
  },
  {
    id: 'i5-12500',
    shortName: 'i5-12500',
    name: 'Core i5-12500',
    cpu: 'Intel Core i5-12500',
    ram: 'DDR4-3200',
  },
  {
    id: 'altra-q80-30',
    shortName: 'Altra Q80-30',
    name: 'Ampere Altra Q80-30',
    cpu: 'Ampere Altra Q80-30',
    ram: 'DDR4-2133',
  },
];
