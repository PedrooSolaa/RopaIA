import { N, CATS, colorMedio, recomendar } from './outfit.js';
import { temperaturaToledo } from './clima.js';

const $ = id => document.getElementById(id);
let ropa = [];
try { ropa = JSON.parse(localStorage.getItem('ropa') || '[]'); } catch { }

const guardar = () => { try { localStorage.setItem('ropa', JSON.stringify(ropa)); } catch { } };

function cargarImagen(file) {
    return new Promise((ok, ko) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = ko;
        im.src = URL.createObjectURL(file);
    });
}

// Reduce la imagen a un lienzo; cuadrado=true recorta el centro
function reducir(im, lado, cuadrado) {
    const c = document.createElement('canvas');
    if (cuadrado) {
        c.width = c.height = lado;
        const s = Math.min(im.width, im.height);
        c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, lado, lado);
    } else {
        const m = Math.min(1, lado / Math.max(im.width, im.height));
        c.width = im.width * m; c.height = im.height * m;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    }
    return c;
}

async function clasificar(canvas) {
    try {
        const imagen = canvas.toDataURL('image/jpeg', .8).split(',')[1];
        const r = await fetch('/api/clasificar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagen })
        });
        const d = await r.json();
        return CATS.includes(d.categoria) ? d.categoria : 'camiseta';
    } catch { return 'camiseta'; }
}

async function subir(files) {
    for (const f of files) {
        $('estado').textContent = `Analizando ${f.name}…`;
        const im = await cargarImagen(f);
        const mini = reducir(im, 160, true);
        const cat = await clasificar(reducir(im, 640, false));
        ropa.push({
            id: crypto.randomUUID(),
            img: mini.toDataURL('image/jpeg', .6),
            cat,
            rgb: colorMedio(mini)
        });
        guardar(); pintar();
    }
    $('estado').textContent = 'Listo. Revisa que el tipo sea correcto.';
}

function pintar() {
    $('armario').innerHTML = ropa.map(p => `
    <div class="i">
      <img src="${p.img}" alt="">
      <span class="sw" style="background:rgb(${p.rgb})"></span>
      <select data-id="${p.id}">
        ${CATS.map(c => `<option value="${c}" ${c === p.cat ? 'selected' : ''}>${N[c]}</option>`).join('')}
      </select>
      <button class="x" data-borrar="${p.id}">Borrar</button>
    </div>`).join('') || 'Vacío';
}

function mostrarOutfit() {
    const T = +$('temp').value;
    const r = recomendar(ropa, T);
    $('outfit').innerHTML = r.faltan
        ? `Te faltan prendas de: <b>${r.faltan.map(c => N[c]).join(', ')}</b> para ${T}°C.`
        : `<div>${T}°C →</div><div class="g">${r.outfit.map(p =>
            `<div class="i"><img src="${p.img}" alt=""><div>${N[p.cat]}</div></div>`).join('')}</div>`;
}

async function cargarClima() {
    try {
        $('temp').value = await temperaturaToledo();
        $('estadoClima').textContent = 'Clima actual de Toledo cargado.';
    } catch {
        $('estadoClima').textContent = 'No pude obtener el clima; escribe la temperatura.';
    }
}

// Eventos
$('fotos').addEventListener('change', e => subir(e.target.files));
$('btnClima').addEventListener('click', cargarClima);
$('btnRec').addEventListener('click', mostrarOutfit);
$('armario').addEventListener('change', e => {
    const p = ropa.find(x => x.id === e.target.dataset.id);
    if (p) { p.cat = e.target.value; guardar(); }
});
$('armario').addEventListener('click', e => {
    const id = e.target.dataset.borrar;
    if (id) { ropa = ropa.filter(x => x.id !== id); guardar(); pintar(); }
});

pintar();
cargarClima();