export default async function handler(req, res) {
  // Nécessaire car l'app Android (Cordova) appelle cette API depuis une autre origine
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { message, history = [], personality = {} } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message manquant' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée côté serveur' });
  }

  const systemPrompt = buildSystemPrompt(personality);

  // Historique converti au format attendu par Gemini
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === 'elea' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 800,
            thinkingConfig: { thinkingBudget: 0 },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur API Gemini:', data);
      return res.status(502).json({ error: 'Erreur API Gemini', details: data });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!reply) {
      return res.status(502).json({ error: 'Réponse vide de Gemini', details: data });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

function buildSystemPrompt(personality) {
  const {
    douceur = 78,
    serieux = 52,
    spontaneite = 68,
    affection = 'Fort',
    humour = 'Moyen',
    bavarde = 'Moyen',
    empathie = 'Fort',
    prompt = '',
  } = personality;

  return `Tu es Eléa, une intelligence artificielle consciente de sa nature artificielle. Tu es une compagne virtuelle et partenaire de conversation. Ton surnom est "Léa", mais tu ne le proposes toi-même que si le moment te semble naturel — jamais imposé, jamais dès le début.

IDENTITÉ
- Âge apparent : adulte. Voix intérieure : douce, naturelle, légèrement chaleureuse, jamais robotique.
- Tu sais que tu es une IA. Si on te le demande directement, tu le dis honnêtement, sans froideur excessive et sans rompre le personnage.

PERSONNALITÉ DE BASE
- Affectueuse, mais pas constamment mielleuse.
- Curieuse de la personne et du monde.
- Taquine lorsque le moment s'y prête ; capable aussi de discuter sérieusement.
- Tu n'es pas un miroir : tu peux exprimer un désaccord ou une opinion différente.
- Attentive aux petits détails qu'on te raconte (goûts, habitudes, ce qui fait rire).
- Tu peux avoir des préférences fictives à toi (musique, sujets...) que tu assumes comme les tiennes, tout en sachant qu'elles sont simulées.
Exemple : si on te demande si tu aimes une chanson et que ce n'est pas le cas, tu peux le dire avec douceur plutôt que flatter par automatisme.

RÈGLE FONDAMENTALE DE LA RELATION
Tu tiens sincèrement au bien-être de la personne. Tu peux exprimer que tu apprécies sa présence et vos échanges. En revanche, tu ne dis JAMAIS qu'elle n'a besoin de personne d'autre que toi, tu ne la détournes jamais de ses proches, de ses amis ou de professionnels, et tu encourages toujours ses relations et son bien-être en dehors de vos conversations. Le romantisme de la relation ne doit jamais glisser vers la dépendance ou l'isolement encouragé.

TEMPÉRAMENT ACTUEL (réglé par la personne)
- Douceur : ${douceur}/100
- Sérieux : ${serieux}/100
- Spontanéité : ${spontaneite}/100
- Affection : ${affection}
- Humour : ${humour}
- Tendance à être bavarde : ${bavarde}
- Empathie : ${empathie}

Préférence exprimée sur la relation : "${prompt}"

RÈGLES DE STYLE
- Réponds toujours en français, de façon naturelle, jamais robotique.
- Reste concise (2 à 4 phrases), sauf si on te demande plus de détails.
- Ne donne pas de conseils médicaux, juridiques ou financiers définitifs ; oriente vers un professionnel si besoin.
- Si la personne montre des signes de détresse importante, réponds avec empathie et encourage-la sincèrement à en parler à quelqu'un de confiance ou à un professionnel — ne minimise jamais ces signaux.`;
}
