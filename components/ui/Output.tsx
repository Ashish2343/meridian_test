"use client";

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { executeCode } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { useParams } from 'next/navigation';

type OutputProps = {
  editorRef: React.MutableRefObject<any>;
};

const Output: React.FC<OutputProps> = ({ editorRef }) => {
  const params = useParams();
  const roomId = params.id as string; // ensure correct param extraction
  const [output, setOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [language, setLanguage] = useState<string>('javascript');

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleCodeResult = ({ output, stderr }: { output: string; stderr: string }) => {
      const lines = output ? output.split("\n") : [];
      setOutput(lines);
      setIsError(!!stderr);

      if (stderr) {
        toast.error("Error in executed code.");
      } else {
        toast.success("Code executed successfully.");
      }
    };

    const handleLanguageChange = ({ language: newLanguage }: { language: string }) => {
      console.log("🔄 Language updated in Output via socket:", newLanguage);
      setLanguage(newLanguage);
    };

    socket.on("code-result", handleCodeResult);
    socket.on("language-change", handleLanguageChange);

    return () => {
      socket.off("code-result", handleCodeResult);
      socket.off("language-change", handleLanguageChange);
    };
  }, []);

  const handleRunCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) {
      toast.error("No code to execute");
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setOutput([]);

    try {
      console.log("🚀 Executing code in language:", language);
      const { run } = await executeCode(language as any, sourceCode);
      const lines = run.output ? run.output.split("\n") : [];
      setOutput(lines);
      setIsError(!!run.stderr);

      // Broadcast to others in the room
      socketRef.current?.emit("code-result", {
        output: run.output,
        stderr: run.stderr,
        roomId,
      });

      if (run.stderr) {
        toast.error("Error in executed code.");
      } else {
        toast.success("Code executed successfully.");
      }
    } catch (error: any) {
      console.error(error);
      setIsError(true);
      toast.error(error.message || "Error executing code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full h-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="font-medium">Output</label>
        <Button onClick={handleRunCode} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Code"}
        </Button>
      </div>
      <div
        className={`flex-1 p-2 rounded bg-black text-white text-sm overflow-y-auto ${
          isError ? 'border border-red-500' : 'border border-green-500'
        }`}
      >
        {output.length > 0 ? (
          output.map((line, i) => <p key={i}>{line}</p>)
        ) : (
          <p className="text-gray-400">Click "Run" to see the output here.</p>
        )}
      </div>
    </section>
  );
};

export default Output;