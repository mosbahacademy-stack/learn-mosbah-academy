export function toEmbeddableVideoUrl(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const raw = input.trim();

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (url.pathname.startsWith('/embed/')) {
        return raw;
      }
    }

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
  } catch {
    return raw;
  }

  return raw;
}
