import Link from 'next/link';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

export default function NotFound() {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${colors.bgPrimary} ${colors.textPrimary} p-4`}>
      <h1 className={`${typography.h2} mb-4`}>404 - Page Not Found</h1>
      <p className={`${typography.paragraphLarge} mb-6`}>The page you are looking for does not exist.</p>
      <Link href="/" className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}>
        Return Home
      </Link>
    </div>
  );
}
