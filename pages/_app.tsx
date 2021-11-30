import '../styles/globals.css'
import { useEffect } from 'react';
import { useRouter } from "next/router";
import nProgress from "nprogress";
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => {
      console.log("START");
      nProgress.start();
    }
    const handleStop = () => {
      console.log("STOP");
      nProgress.done();
    }
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeError", handleStop);
    router.events.on("routeChangeComplete", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeError", handleStop);
      router.events.off("routeChangeComplete", handleStop);
    }
  }, [ router ]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%" }}>
      <Component {...pageProps} />
    </div>
  );
}
export default MyApp
