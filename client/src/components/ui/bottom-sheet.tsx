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
    >
      <div className="p-0">
        {children}
      </div>
    </ReactSpringBottomSheet>
  );
}