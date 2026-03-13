import { Header } from "@/components/header";

export default function PrepLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh flex-col">
      <Header stepStatuses={[]} />
      {children}
    </div>
  );
}
