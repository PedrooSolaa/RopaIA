export async function temperaturaToledo() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=39.86&longitude=-4.02&current=temperature_2m';
    const r = await fetch(url);
    if (!r.ok) throw new Error('Sin clima');
    const d = await r.json();
    return Math.round(d.current.temperature_2m);
}