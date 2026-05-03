import "@/styles/globals.css";
import Footer from "@/components/ui/Footer";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Sidebar from "@/components/ui/Sidebar";

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...restPageProps } = pageProps;

  return (
    <SessionProvider session={session}>
      <main className="min-h-screen flex">
        <div className="order-1">
          <Sidebar />
        </div>
        <div className="order-2 flex-1 flex flex-col">
          <Component {...restPageProps} />
          <Footer />
        </div>
      </main>
    </SessionProvider>
  );
}
