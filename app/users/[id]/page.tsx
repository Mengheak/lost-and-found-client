import { Suspense } from "react";
import { PublicProfile } from "@/components/community/profile";
async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicProfile id={id} />;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">Loading profile…</p>}>
      <Profile params={params} />
    </Suspense>
  );
}
