import { Navbar } from "@/components/layout/Navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showAuth={true} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
