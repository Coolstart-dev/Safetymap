import { MapPin, Users, Heart } from "lucide-react";

export default function MyNeighborhood() {
  return (
    <div className="flex flex-col h-full p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          My Neighborhood
        </h3>
        
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          This section is coming soon! Here you'll be able to see personalized insights about your local area.
        </p>
        
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Community insights</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Heart className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Safety recommendations</span>
          </div>
        </div>
      </div>
    </div>
  );
}