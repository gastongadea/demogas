/** Parsea respuesta JSON del API y devuelve un mensaje legible si falla. */
export async function parseApiResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const looksLikeHtml = text.trimStart().startsWith('<');
    throw new Error(
      looksLikeHtml
        ? 'La API no respondió correctamente. ¿Está desplegada en Vercel?'
        : 'El servidor no devolvió JSON.'
    );
  }
  return { data, ok: res.ok };
}

export function apiErrorMessage(data, fallback) {
  return data?.details || data?.error || fallback;
}
