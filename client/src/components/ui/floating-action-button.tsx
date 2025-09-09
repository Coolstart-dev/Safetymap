import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  "data-testid"?: string;
}

export default function FloatingActionButton({ 
  onClick, 
  className,
  "data-testid": testId 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "floating-action-button-override fixed bottom-80 right-6 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 border-4 border-white/30",
        className
      )}
      data-testid={testId}
    >
      <Plus className="h-8 w-8 stroke-2" />
    </Button>
  );
}
