import JukeboxClient from "./JukeboxClient";

export default async function JukeboxPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JukeboxClient code={decodeURIComponent(code)} />;
}