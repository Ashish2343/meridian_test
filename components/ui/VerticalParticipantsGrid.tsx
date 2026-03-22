'use client'

import React, { useState } from 'react'
import { useCall, ParticipantView } from '@stream-io/video-react-sdk'
import CodeEditor from './CodeEditor'
import { CODE_SNIPPETS } from "@/constants/LanguageVersion"
import Split from 'react-split'

type Language = keyof typeof CODE_SNIPPETS

const VerticalRightLayout = () => {
  const call = useCall()
  const participants = Array.from(call?.state.participants.values() || [])
  
  // Get the ID of the person who created the call (the Host)
  const hostId = call?.state.createdBy?.id

  // Editor state lives HERE
  const [language, setLanguage] = useState<Language>("javascript")
  const [code, setCode] = useState<string>(CODE_SNIPPETS["javascript"])

  return (
    <div className="absolute inset-0 flex z-10 pointer-events-none">
      <Split
        sizes={[75, 25]}          // initial sizes (percent)
        minSize={[400, 200]}      // min sizes for editor and sidebar
        gutterSize={5}            // draggable bar size
        className="flex w-full h-full pointer-events-auto"
        gutterAlign="center"
      >
        {/* Code Editor */}
        <div className="overflow-hidden bg-neutral-900">
          <CodeEditor
            language={language}
            setLanguage={setLanguage}
            code={code}
            setCode={setCode}
          />
        </div>

        {/* Participants Sidebar */}
        <div
          className="
            h-full
            overflow-y-auto
            bg-[#0f141b]
            border-l 
            border-[#1f2937]
            p-2
            space-y-2
            flex-shrink-0 flex-col
            items-center
            hidden sm:flex
          "
        >
          {participants.map((participant) => {
            // Check if this specific participant is the host
            const isHost = participant.userId === hostId;

            return (
              <div
                key={participant.sessionId}
                className="w-full rounded-lg overflow-hidden bg-black relative"
                style={{ aspectRatio: '16/9' }}
              >
                <ParticipantView participant={participant} />
                
                {/* Host/Joinee Badge */}
                <div className="absolute top-2 left-2 z-20">
                  {isHost ? (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                      Host
                    </span>
                  ) : (
                    <span className="bg-zinc-700/80 text-zinc-300 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
                      Joinee
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Split>
    </div>
  )
}

export default VerticalRightLayout