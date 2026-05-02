import AuthLayout from "@/components/nav/AuthLayout";

export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
