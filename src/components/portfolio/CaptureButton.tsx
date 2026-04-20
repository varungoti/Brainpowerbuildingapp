import React, { useRef } from "react";
import { validateImageFile } from "../../utils/fileValidation";

interface Props {
  onCapture: (dataUrl: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function CaptureButton({ onCapture, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      onError?.(check.reason ?? "Invalid image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result as string);
    reader.onerror = () => onError?.("Could not read the selected file.");
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #4361EE, #7209B7)" }}
      >
        <span>📸</span>
        <span>Capture</span>
      </button>
    </>
  );
}
