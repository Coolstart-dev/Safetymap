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
  defaultSnap = 1
}: BottomSheetProps) {
  return (
    <ReactSpringBottomSheet 
      open={open}
      onDismiss={onDismiss}
      defaultSnap={defaultSnap}
      snapPoints={({ maxHeight }) => [
        80,               // Laag (alleen grip balkje)
        maxHeight * 0.5,  // Midden (half scherm)  
        maxHeight - 100   // Hoog (bijna volledig scherm)
      ]}
      blocking={false}
      expandOnContentDrag={true}
      header={
        <div className="w-full flex justify-center py-3">
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