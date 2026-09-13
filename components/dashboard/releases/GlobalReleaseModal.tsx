import { getUnreadReleases } from '@/actions/releases/user.actions';
import { ReleaseModalClient } from './ReleaseModalClient';

export async function GlobalReleaseModal() {
  try {
    const unreadReleases = await getUnreadReleases();
    if (unreadReleases.length === 0) return null;

    return <ReleaseModalClient unreadReleases={unreadReleases} />;
  } catch (error) {
    // Si hay error (ej. usuario no logueado), no fallar la app
    return null;
  }
}
