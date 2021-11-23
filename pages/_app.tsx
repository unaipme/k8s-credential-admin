import '../styles/globals.css'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column" }}>
      <div style={{ width: "50%", height: "100%" }}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
export default MyApp
