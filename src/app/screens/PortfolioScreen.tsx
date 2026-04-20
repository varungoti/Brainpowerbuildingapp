import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { compressImageDataUrl, inferDevelopmentalStage, filterByChild } from "../../lib/portfolio/portfolioStore";
import { validateImageFile } from "../../utils/fileValidation";

export function PortfolioScreen() {
  const { activeChild, portfolioEntries, addPortfolioEntry, removePortfolioEntry } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = activeChild
    ? filterByChild(portfolioEntries, activeChild.id)
    : [];

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file || !activeChild) return;

    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.reason ?? "Invalid image.");
      return;
    }
    setError(null);

    setCapturing(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const compressed = await compressImageDataUrl(dataUrl);
      addPortfolioEntry({
        childId: activeChild.id,
        imageDataUrl: compressed,
        intelligences: [],
        tags: [],
        caption: caption || `${activeChild.name}'s creation`,
        stage: inferDevelopmentalStage(activeChild.ageTier),
        includeInReport: true,
      });
      setCaption("");
    } catch {
      setError("Could not process the image. Try a different photo.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Creation Portfolio</h2>
        <p className="text-xs text-gray-500">Capture and tag your child's creative work</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
          id="portfolio-capture"
        />
        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-xl text-sm text-gray-700"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={capturing || !activeChild}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #4361EE, #7209B7)" }}
        >
          {capturing ? "Processing..." : "Capture Creation"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📸</div>
          <p className="text-sm text-gray-500">No creations yet — capture your child's work!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <img
                src={entry.imageDataUrl}
                alt={entry.caption}
                className="w-full h-32 object-cover"
              />
              <div className="p-2">
                <p className="text-[10px] font-medium text-gray-900 truncate">{entry.caption}</p>
                <p className="text-[9px] text-gray-400">{entry.stage}</p>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {entry.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full text-[8px] bg-purple-50 text-purple-600">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => removePortfolioEntry(entry.id)}
                  className="mt-1 text-[9px] text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
