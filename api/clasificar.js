const CATEGORIAS = ['camiseta', 'jersey', 'chaqueta', 'largo', 'corto', 'calzado'];

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

    const { imagen } = req.body || {};
    if (!imagen) return res.status(400).json({ error: 'Falta la imagen' });

    try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-5-5',
                max_tokens: 10,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagen } },
                        { type: 'text', text: 'Clasifica la prenda de la foto. Responde SOLO una palabra: camiseta, jersey (jersey o sudadera), chaqueta (chaqueta o abrigo), largo (pantalón largo), corto (pantalón corto o bermuda) o calzado.' }
                    ]
                }]
            })
        });
        const d = await r.json();
        const texto = (d.content?.[0]?.text || '').toLowerCase();
        const categoria = CATEGORIAS.find(c => texto.includes(c)) || 'camiseta';
        res.status(200).json({ categoria });
    } catch (e) {
        res.status(500).json({ error: 'Fallo al clasificar' });
    }
};