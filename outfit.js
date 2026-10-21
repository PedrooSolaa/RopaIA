export const N = {
    camiseta: 'Camiseta', jersey: 'Jersey', chaqueta: 'Chaqueta',
    largo: 'Pantalón largo', corto: 'Pantalón corto', calzado: 'Calzado'
};
export const CATS = Object.keys(N);

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

// Qué categorías hacen falta según la temperatura
export function necesarias(T, ropa) {
    const hay = c => ropa.some(p => p.cat === c);
    const need = ['camiseta', 'calzado'];
    need.push(T >= 24 && hay('corto') ? 'corto' : 'largo');
    if (T < 17) need.push('jersey');
    if (T < 14 || (T < 20 && hay('chaqueta'))) need.push('chaqueta');
    return need;
}

// Devuelve { faltan: [...] } o { outfit: [...] }
export function recomendar(ropa, T) {
    const need = necesarias(T, ropa);
    const por = c => ropa.filter(p => p.cat === c);
    const faltan = need.filter(c => !por(c).length);
    if (faltan.length) return { faltan };

    let mejor = null, max = -Infinity;
    (function probar(i, actual) {
        if (i === need.length) {
            let s = 0;
            const calzado = actual.find(p => p.cat === 'calzado');
            const resto = actual.filter(p => p !== calzado);
            for (let a = 0; a < resto.length; a++)
                for (let b = a + 1; b < resto.length; b++) s += puntuarPar(resto[a], resto[b]);
            resto.forEach(p => s += puntuarPar(calzado, p) * .5);
            s += Math.random() * .5; // para que varíe si hay empates
            if (s > max) { max = s; mejor = [...actual]; }
            return;
        }
        por(need[i]).forEach(p => probar(i + 1, [...actual, p]));
    })(0, []);
    return { outfit: mejor };
}