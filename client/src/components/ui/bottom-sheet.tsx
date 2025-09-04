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
      defaultSnap={defaultSnap || (({ maxHeight }) => maxHeight * 0.75)}
      snapPoints={({ maxHeight }) => [
        maxHeight * 0.9,       // Laag: 10% uitgeschoven
        maxHeight * 0.6,       // Midden: 40% uitgeschoven  
        maxHeight * 0.1        // Hoog: 90% uitgeschoven
      ]}
      blocking={false}
      expandOnContentDrag={true}
      header={
        <div className="w-full flex justify-center py-2">
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