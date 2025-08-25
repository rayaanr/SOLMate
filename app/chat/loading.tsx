import { Loader } from "@/components/prompt-kit/loader";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader variant="wave" size="md" />
        <Loader variant="text-shimmer" text="Loading chat..." size="md" />
      </div>
    </div>
  );
}
