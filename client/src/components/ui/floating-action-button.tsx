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
        "fixed bottom-6 right-6 w-14 h-14 rounded-full glass-button transition-all duration-300 z-50 hover:scale-105",
        "text-accent-foreground",
        className
      )}
      data-testid={testId}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
