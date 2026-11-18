import { useState, useEffect } from "react";

interface AvatarImageProps {
  url?: string | null;
  handle?: string | null;
  name?: string | null;
  className?: string;
  fallbackDicebear?: boolean;
}

export default function AvatarImage({
  url,
  handle,
  name,
  className = "w-full h-full object-cover",
  fallbackDicebear = true,
}: AvatarImageProps) {
  const cleanHandle = handle ? handle.replace(/^@/, "").trim() : null;
  const initialSrc = url || (cleanHandle ? `https://github.com/${cleanHandle}.png` : null);
  const [imgSrc, setImgSrc] = useState<string | null>(initialSrc);
  const [stage, setStage] = useState<"url" | "github" | "dicebear" | "initial">(
    url ? "url" : cleanHandle ? "github" : "dicebear"
  );

  useEffect(() => {
    const nextHandle = handle ? handle.replace(/^@/, "").trim() : null;
    const nextSrc = url || (nextHandle ? `https://github.com/${nextHandle}.png` : null);
    setImgSrc(nextSrc);
    setStage(url ? "url" : nextHandle ? "github" : "dicebear");
  }, [url, handle]);

  const handleError = () => {
    const nextHandle = handle ? handle.replace(/^@/, "").trim() : null;
    if (stage === "url" && nextHandle && imgSrc !== `https://github.com/${nextHandle}.png`) {
      setImgSrc(`https://github.com/${nextHandle}.png`);
      setStage("github");
    } else if ((stage === "url" || stage === "github") && fallbackDicebear) {
      const seed = encodeURIComponent(name || nextHandle || "?");
      setImgSrc(`https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=0707f2&textColor=ffffff`);
      setStage("dicebear");
    } else {
      setStage("initial");
    }
  };

  if (stage === "initial" || !imgSrc) {
    return <span>{name?.charAt(0).toUpperCase() || cleanHandle?.charAt(0).toUpperCase() || "?"}</span>;
  }

  return (
    <img
      src={imgSrc}
      alt={name || handle || ""}
      referrerPolicy="no-referrer"
      className={className}
      onError={handleError}
    />
  );
}
