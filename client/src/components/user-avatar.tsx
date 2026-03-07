interface UserAvatarProps {
  fullName: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  testId?: string;
}

const sizeClasses = {
  xs: "w-7 h-7 text-[9px]",
  sm: "w-9 h-9 text-[10px]",
  md: "w-11 h-11 text-xs",
  lg: "w-14 h-14 text-sm",
  xl: "w-20 h-20 text-lg",
};

export function UserAvatar({ fullName, photoUrl, size = "sm", className = "", testId }: UserAvatarProps) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}
      data-testid={testId}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}
