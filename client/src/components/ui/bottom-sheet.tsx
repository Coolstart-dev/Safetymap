import React from 'react';
import { BottomSheet as ReactSpringBottomSheet } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';

interface BottomSheetProps {
  children: React.ReactNode;
  open?: boolean;
  onDismiss?: () => void;
  defaultSnap?: number;
}

export default function BottomSheet({ 
  children, 
  open = true,
  onDismiss,
  defaultSnap
}: BottomSheetProps) {
  return (
    <ReactSpringBottomSheet 
      open={open}
      onDismiss={onDismiss}
      defaultSnap={defaultSnap || (({ snapPoints }) => snapPoints[1])}
      snapPoints={({ maxHeight }) => [
        maxHeight * 0.1,       // Laag: 10% open
        maxHeight * 0.4,       // Midden: 40% open
        maxHeight * 0.9        // Hoog: 90% open
      ]}
      blocking={false}
      expandOnContentDrag={true}
      header={
        <div className="w-full flex justify-center py-1">
          <div className="w-12 h-1.5 bg-gray-400 rounded-full"></div>
        </div>
      }
    >
      <div className="p-0">
        {children}
      </div>
    </ReactSpringBottomSheet>
  );
}