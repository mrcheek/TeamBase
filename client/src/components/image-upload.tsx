import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";

interface ImageUploadProps {
  currentUrl: string;
  onUpload: (url: string) => void;
  uploadEndpoint?: string;
  testId: string;
  variant?: "avatar" | "banner";
}

export function ImageUpload({ currentUrl, onUpload, uploadEndpoint = "/api/upload/avatar", testId, variant = "banner" }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(uploadEndpoint, { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      const data = await res.json();
      onUpload(data.url);
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  if (variant === "avatar") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden bg-muted cursor-pointer group"
          onClick={() => !uploading && fileRef.current?.click()}
          data-testid={`${testId}-container`}
        >
          {currentUrl ? (
            <img src={currentUrl} alt="Profile photo" className="w-full h-full object-cover" data-testid={`${testId}-preview`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid={`${testId}-input`} />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            data-testid={`${testId}-upload`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="w-3 h-3" />
                {currentUrl ? "Change Photo" : "Upload Photo"}
              </>
            )}
          </Button>
          {currentUrl && (
            <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => onUpload("")} data-testid={`${testId}-clear`}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          data-testid={`${testId}-upload`}
        >
          <Camera className="w-3 h-3" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid={`${testId}-input`} />
        {currentUrl && (
          <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => onUpload("")} data-testid={`${testId}-clear`}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      {currentUrl && (
        <div className="relative w-full h-16 rounded overflow-hidden bg-muted">
          <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" data-testid={`${testId}-preview`} />
        </div>
      )}
    </div>
  );
}
