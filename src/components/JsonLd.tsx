import Script from "next/script";

type Props = {
  data: unknown | unknown[];
  id?: string;
  /** Where to inject the script. Use "beforeInteractive" to put it in <head>. */
  strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload";
};

export default function JsonLd({
  data,
  id = "jsonld",
  strategy = "beforeInteractive",
}: Props) {
  const json = Array.isArray(data) ? data : [data];
  return (
    <Script id={id} type='application/ld+json' strategy={strategy}>
      {JSON.stringify(json)}
    </Script>
  );
}
