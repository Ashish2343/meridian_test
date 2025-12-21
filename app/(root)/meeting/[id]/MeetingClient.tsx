// app/meeting/[id]/MeetingClient.tsx
'use client';

import MeetingSetup from '@/components/ui/MeetingSetup';
import MeetingRoom from '@/components/ui/MeetingRoom';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useState } from 'react';
import { useGetCallById } from '@/hooks/useGetCallById';
import Loader from '@/components/ui/Loader';

export default function MeetingClient({ id }: { id: string }) {
  console.log('🟢 MeetingClient render', id);

  const { isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isCallLoading } = useGetCallById(id);
  console.log('🟡 isSetupComplete:', isSetupComplete)

  if (!isLoaded || isCallLoading || !call) return <Loader />;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} call={call} />
          ) : (
            <MeetingRoom roomId={id} />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
}
