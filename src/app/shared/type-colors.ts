/** Color de cada tipo de energía (nombres en español e inglés). */
const TYPE_COLORS: Record<string, string> = {
  fuego: '#ff7b3a', fire: '#ff7b3a',
  agua: '#4fb3ff', water: '#4fb3ff',
  planta: '#6fd36a', grass: '#6fd36a',
  rayo: '#ffd93d', lightning: '#ffd93d',
  'psíquico': '#c77dff', psychic: '#c77dff',
  lucha: '#d9844a', fighting: '#d9844a',
  oscuridad: '#6c7a89', darkness: '#6c7a89',
  metal: '#b8c4cf',
  'dragón': '#d4af37', dragon: '#d4af37',
  hada: '#ff9bd2', fairy: '#ff9bd2',
  incoloro: '#e8e8e8', colorless: '#e8e8e8',
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? '#9fb3c8';
}
