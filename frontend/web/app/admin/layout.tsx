// Minimal admin root layout — authentication is handled in app/admin/(panel)/layout.tsx
// Login page lives here without the auth guard.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
