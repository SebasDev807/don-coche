import { getLatestPublishedRelease } from '@/actions/releases/user.actions';
import { ReleaseModalClient } from './ReleaseModalClient';

export async function GlobalReleaseModal() {
  try {
    const latestRelease = await getLatestPublishedRelease();
    if (!latestRelease) return null;

    return <ReleaseModalClient latestRelease={latestRelease} />;
  } catch (error) {
    // Si hay error (ej. usuario no logueado), no fallar la app
    return null;
  }
}
