export interface SpearConfig {
  id: string;
  baseX: number;
  baseY: number;
  explodeX: number;
  explodeY: number;
  explodeRotate: number;
  height: number;
  width: number;
  color: string;
  colorDark: string;
  bractsCount: number;
}

export const spears: SpearConfig[] = [
  { id: 'spear-1', baseX: -80, baseY: 20,  explodeX: -320, explodeY: -60,  explodeRotate: -15, height: 380, width: 10, color: '#6ab35a', colorDark: '#5a9e4a', bractsCount: 4 },
  { id: 'spear-2', baseX: -40, baseY: -10, explodeX: -140, explodeY: -80,  explodeRotate: -8,  height: 420, width: 12, color: '#5c9e4e', colorDark: '#4a8c3e', bractsCount: 5 },
  { id: 'spear-3', baseX: 0,   baseY: -30, explodeX: 0,    explodeY: -100, explodeRotate: 2,   height: 450, width: 14, color: '#4e9040', colorDark: '#3d7a32', bractsCount: 5 },
  { id: 'spear-4', baseX: 40,  baseY: 0,   explodeX: 140,  explodeY: -60,  explodeRotate: 10,  height: 400, width: 11, color: '#6aad5c', colorDark: '#5a9e4a', bractsCount: 4 },
  { id: 'spear-5', baseX: 80,  baseY: 15,  explodeX: 320,  explodeY: -40,  explodeRotate: 18,  height: 370, width: 10, color: '#5c9e4e', colorDark: '#4a8c3e', bractsCount: 3 },
];
