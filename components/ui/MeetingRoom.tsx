'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { Eye, LayoutList, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import EndCallButton from './EndCallButton';
import VerticalRightLayout from './VerticalParticipantsGrid';
import { getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import Image from 'next/image';

type CallLayoutType = 'speaker-left' | 'speaker-right' | 'vertical-right' | 'grid';

const MeetingRoom = ({ roomId }: { roomId: string }) => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const router = useRouter();
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  const isHost = localParticipant &&  call?.state.createdBy && localParticipant.userId === call.state.createdBy.id;

  // UI: hide/show controls on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY >= window.innerHeight - 100) {
        setShowControls(true);
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  console.log('🔥 MeetingRoom render', roomId);
  // Socket connection for editor sync
  useEffect(() => {
    console.log('MeetingRoom');
    if (!roomId) return;
    console.log('Setting up socket for room:', roomId);
    const socket = getSocket();
    console.log('Socket instance:', socket);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      socket.emit('join-room', { roomId });
    });

    socket.on('toggle-editor', ({ isOpen }: { isOpen: boolean }) => {
      setIsEditorOpen(isOpen);
      setLayout(isOpen ? 'vertical-right' : 'grid');
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  
    // 1. Host Logic: Listen for notifications from the server
  useEffect(() => {
    if (isHost && socketRef.current) {
      socketRef.current.on('notify-host-tab-switch', ({ userName }) => {
        console.log('Received tab switch notification for user:', userName);
        if (isMonitoringActive) {
          console.log(`🚨 Host notified of tab switch by ${userName}`);
          toast.warning(`Alert: ${userName} has switched their browser tab!`);
        }
      });
    }
    return () => {
      socketRef.current?.off('notify-host-tab-switch');
    };
  }, [isHost, isMonitoringActive]);

  // 2. Joinee Logic: Detect tab switches and notify the server
  useEffect(() => {
    if (!isHost) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          socketRef.current?.emit('tab-switched', { 
            roomId, 
            userName: localParticipant?.name || 'A joinee' 
          });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [isHost, roomId, localParticipant]);

  return (
    <section className="relative h-screen w-full overflow-hidden text-white bg-black">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          {layout === 'grid' && <PaginatedGridLayout />}
          {layout === 'speaker-left' && <SpeakerLayout participantsBarPosition="left" />}
          {layout === 'speaker-right' && <SpeakerLayout participantsBarPosition="right" />}
          {layout === 'vertical-right' && <VerticalRightLayout />}
        </div>

        {showParticipants && (
          <div className="h-[calc(100vh-86px)] ml-2">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
          'bg-black/60 backdrop-blur-md rounded-2xl shadow-lg',
          'px-4 py-2 flex items-center gap-3',
          'transition-all duration-300',
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        )}
      >
        <CallControls onLeave={() => router.push(`/dashboard`)} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full bg-[#19232d] hover:bg-[#2c3b4b]">
              <LayoutList size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1f24] text-white border border-[#2a2f35]">
            {[
              { label: 'Grid', value: 'grid' },
              { label: 'Speaker Left', value: 'speaker-left' },
              { label: 'Speaker Right', value: 'speaker-right' },
            ].map((item) => (
              <DropdownMenuItem
                key={item.value}
                onClick={() => setLayout(item.value as CallLayoutType)}
                className="cursor-pointer hover:bg-[#2a2f35]"
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <CallStatsButton />

        <button
          onClick={() => setShowParticipants((prev) => !prev)}
          className="p-2 rounded-full bg-[#19232d] hover:bg-[#2c3b4b]"
        >
          <Users size={20} />
        </button>

        <button
          onClick={() =>
            socketRef.current?.emit('toggle-editor', { roomId, isOpen: !isEditorOpen })
          }
          className={cn(
            'flex items-center justify-center h-10 w-10 rounded-2xl transition-colors',
            isEditorOpen ? 'bg-red-500 hover:bg-red-400' : 'bg-green-600 hover:bg-green-500'
          )}
        >
          <Image src="/icons/code.svg" alt="Code Editor" width={20} height={20} />
        </button>

        {isHost && (
          <button 
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={cn(
              "p-2 rounded-full transition-colors",
              isMonitoringActive ? "bg-red-600 text-white" : "bg-zinc-700 text-zinc-300"
            )}
            title={isMonitoringActive ? "Stop Monitoring" : "Start Monitoring Tab Switches"}
          >
            <Eye size={20} />
          </button>
        )}

        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;