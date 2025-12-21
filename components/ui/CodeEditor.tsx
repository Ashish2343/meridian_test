'use client';

import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { io, Socket } from 'socket.io-client';
import LanguageSelector from './LanguageSelector';
import { CODE_SNIPPETS } from '@/constants/LanguageVersion';
import Output from './Output';
import { useParams } from 'next/navigation';
import Split from 'react-split';

type Language = keyof typeof CODE_SNIPPETS;

type CodeEditorProps = {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
};

const CodeEditor = ({ language, code, setLanguage, setCode }: CodeEditorProps) => {
  const params = useParams();
  const roomId = params.id as string;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const socket = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const preventEmit = useRef(false);

  const onMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    editorInstance.focus();
  };

  useEffect(() => {
    const s = io('http://localhost:3001');
    console.log('Connecting to Socket.IO server...',s);
    socket.current = s;

    s.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      s.emit('join-room', { roomId });
      setIsSocketConnected(true);
    });

    s.on('code-change', ({ code: newCode }) => {
      preventEmit.current = true;
      setCode(newCode);
    });

    s.on('language-change', ({ language: newLanguage }) => {
      const lang = newLanguage as Language;
      if (!CODE_SNIPPETS[lang]) return;
      setLanguage(newLanguage);
      setCode(CODE_SNIPPETS[lang]);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value);

    if (preventEmit.current) {
      preventEmit.current = false;
      return;
    }

    socket.current?.emit('code-change', { code: value, roomId });
  };

  const onSelect = (selectedLanguage: Language) => {
    const snippet = CODE_SNIPPETS[selectedLanguage];
    setLanguage(selectedLanguage);
    setCode(snippet);
    if (!isSocketConnected) return;

    socket.current?.emit('code-change', { code: snippet, roomId });
    socket.current?.emit('language-change', { language: selectedLanguage, roomId });
  };

  return (
    <Split
      sizes={[70, 30]}        // initial sizes (%)
      minSize={300}           // minimum width in px
      gutterSize={5}          // size of draggable gutter
      className="h-full flex"
      gutterAlign="center"
      snapOffset={30}
    >
      {/* Left panel: Editor */}
      <div className="flex flex-col h-full p-4 space-y-4 bg-neutral-900 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Collaborative Code Editor</h2>
          <LanguageSelector language={language} onSelect={onSelect} />
        </div>

        <div className="flex-grow bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            onMount={onMount}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      {/* Right panel: Output */}
      <div className="flex flex-col h-full p-4 bg-neutral-950 border-l border-gray-700 overflow-auto">
        <Output editorRef={editorRef} />
      </div>
    </Split>
  );
};

export default CodeEditor;
