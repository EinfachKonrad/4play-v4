import "@/styles/globals.css";
import Footer from "@/components/ui/Footer";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Sidebar from "@/components/ui/Sidebar";
import { useRouter } from "next/router";
import Head from "next/head";
import useInstanceConfig from "@/hooks/useInstanceConfig";

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...restPageProps } = pageProps;
  const router = useRouter();
  const instanceConfig = useInstanceConfig();

  return (
    <SessionProvider session={session}>
      <Head>
        <title>Dashboard &bull; {instanceConfig?.name ?? "4play"}</title>
      </Head>
      <main className="min-h-screen flex">
        { 
          router.pathname !== "/login" &&
        <div className="order-1">
          <Sidebar />
        </div>
        }
        <div className="order-2 flex-1 flex flex-col">
          <div className="flex-1 p-10">
          <Component {...restPageProps} />
          </div>
          <Footer />
        </div>
      </main>
    </SessionProvider>
  );
}
