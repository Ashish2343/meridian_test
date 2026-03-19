import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Supported languages
type Language = "javascript" | "python" | "cpp" | "java" ;

// Judge0 response (simplified)
interface ExecuteCodeResponse {
  run: {
    stdout: string;
    stderr: string;
    output: string;
  };
}

export const executeCode = async (
  language: Language,
  sourceCode: string
): Promise<ExecuteCodeResponse> => {
  const languageMap: Record<Language, number> = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
  };

  const res = await fetch(
    "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language_id: languageMap[language],
        source_code: sourceCode,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Judge0 Error:", text);
    throw new Error("Execution failed");
  }

  const data = await res.json();

  return {
    run: {
      stdout: data.stdout || "",
      stderr: data.stderr || data.compile_output || "",
      output:
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        "",
    },
  };
};