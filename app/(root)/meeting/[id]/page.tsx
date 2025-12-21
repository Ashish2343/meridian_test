import MeetingClient from './MeetingClient';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MeetingClient id={id} />;
}
