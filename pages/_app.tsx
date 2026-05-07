import "@/styles/globals.css";
import Footer from "@/components/ui/Footer";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import Sidebar from "@/components/ui/Sidebar";
import { useRouter } from "next/router";
import Head from "next/head";
import useInstanceConfig from "@/hooks/useInstanceConfig";
import { useEffect } from "react";
import Spinner from "@/components/ui/Spinner";

function AppContent({ Component, pageProps }: { Component: AppProps["Component"]; pageProps: AppProps["pageProps"] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const instanceConfig = useInstanceConfig();

  useEffect(() => {
    if (status === "unauthenticated" && router.pathname !== "/login") {
      router.push("/login");
    }
  }, [status, router.pathname]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex">
        <div className="m-auto">
          <Spinner />
        </div>
      </main>
    );
  }

  if (status === "unauthenticated" && router.pathname !== "/login") {
    return null;
  }

  return (
    <>
      <Head>
        <title>wird geladen... &bull; {instanceConfig?.name ?? "4play"}</title>
      </Head>
      <main className="min-h-screen flex">
        {router.pathname !== "/login" && (
          <div className="order-1">
            <Sidebar />
          </div>
        )}
        <div className="order-2 flex-1 flex flex-col">
          <div className="flex-1 p-10">
            <Component {...pageProps} />
          </div>
          <Footer />
        </div>
      </main>
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...restPageProps } = pageProps;

  return (
    <SessionProvider session={session}>
      <AppContent Component={Component} pageProps={restPageProps} />
    </SessionProvider>
  );
}
