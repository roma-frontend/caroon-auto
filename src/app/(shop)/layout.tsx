import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { FloatingActions } from '@/components/FloatingActions';
import { JsonLd } from '@/components/JsonLd';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
      <MobileNav />
      <JsonLd />
    </div>
  );
}
