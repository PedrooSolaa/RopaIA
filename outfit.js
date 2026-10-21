export const CATS = ['camiseta', 'polo', 'camisa', 'jersey', 'sudadera', 'chaqueta', 'largo', 'corto', 'calzado'];

export const N = {
  camiseta: 'Camiseta', polo: 'Polo', camisa: 'Camisa',
  jersey: 'Jersey', sudadera: 'Sudadera', chaqueta: 'Chaqueta',
  largo: 'Pantalón largo', corto: 'Pantalón corto', calzado: 'Calzado',
  // Nombres de "hueco" para el mensaje cuando no hay ninguna prenda
  base: 'Camiseta, polo o camisa',
  media: 'Jersey o sudadera',
  piernas: 'Pantalón'
};

// Color medio del centro de un canvas 160x160
export function colorMedio(canvas) {
  const d = canvas.getContext('2d').getImageData(55, 55, 50, 50).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const m = Math.max(r, g, b), n = Math.min(r, g, b), l = (m + n) / 2;
  let h = 0, s = 0;
  if (m !== n) {
    const d = m - n;
    s = l > .5 ? d / (2 - m - n) : d / (m + n);
    h = m === r ? (g - b) / d + (g < b ? 6 : 0) : m === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

const esNeutro = p => { const [, s, l] = hsl(...p.rgb); return s < .2 || l < .15 || l > .88; };

function puntuarPar(a, b) {
  if (esNeutro(a) || esNeutro(b)) return 2;
  const d = Math.abs(hsl(...a.rgb)[0] - hsl(...b.rgb)[0]);
  const e = Math.min(d, 360 - d);
  return e < 30 ? 2 : e > 150 ? 1 : -2;
}

// Huecos del outfit según la temperatura. Cada hueco acepta varias categorías.
function huecos(T, ropa) {
  const hay = c => ropa.some(p => p.cat === c);
  const h = [
    { id: 'base', cats: ['camiseta', 'polo', 'camisa'] },
    { id: 'piernas', cats: [T >= 24 && hay('corto') ? 'corto' : 'largo'] },
    { id: 'calzado', cats: ['calzado'] }
  ];
  if (T < 17) h.push({ id: 'media', cats: ['jersey', 'sudadera'] });
  if (T < 14 || (T < 20 && hay('chaqueta'))) h.push({ id: 'chaqueta', cats: ['chaqueta'] });
  return h;
}

// Devuelve { faltan: [...] } (solo si no hay ninguna prenda útil) o { outfit: [...] }
export function recomendar(ropa, T) {
  const todos = huecos(T, ropa);
  const por = s => ropa.filter(p => s.cats.includes(p.cat));

  // Solo los huecos que tienen al menos una prenda: los vacíos se saltan
  const slots = todos.filter(s => por(s).length);
  if (!slots.length) return { faltan: todos.map(s => s.id) };

  let mejor = null, max = -Infinity;
  (function probar(i, actual) {
    if (i === slots.length) {
      let s = 0;
      const calzado = actual.find(p => p.cat === 'calzado');
      const resto = actual.filter(p => p !== calzado);
      for (let a = 0; a < resto.length; a++)
        for (let b = a + 1; b < resto.length; b++) s += puntuarPar(resto[a], resto[b]);
      if (calzado) resto.forEach(p => s += puntuarPar(calzado, p) * .5);
      s += Math.random() * .5; // para que varíe si hay empates
      if (s > max) { max = s; mejor = [...actual]; }
      return;
    }
    por(slots[i]).forEach(p => probar(i + 1, [...actual, p]));
  })(0, []);
  return { outfit: mejor };
}