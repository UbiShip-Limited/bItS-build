// Force dynamic rendering to prevent SSR issues with API client
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}