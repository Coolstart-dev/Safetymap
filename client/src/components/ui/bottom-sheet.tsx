import React, { forwardRef } from 'react';
import { BottomSheet as ReactSpringBottomSheet, BottomSheetRef } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';

interface BottomSheetProps {
  children: React.ReactNode;
  open?: boolean;
  onDismiss?: () => void;
  defaultSnap?: number;
  onClick?: () => void;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(({ 
  children, 
  open = true,
  onDismiss,
  defaultSnap,
  onClick
}: BottomSheetProps, ref) => {
  return (
    <ReactSpringBottomSheet 
      ref={ref}
      open={open}
      onDismiss={onDismiss}
      defaultSnap={defaultSnap || (({ snapPoints }) => snapPoints[1])}
      snapPoints={({ maxHeight }) => [
        maxHeight * 0.2,       // Laag: 20% open (was 10%)
        maxHeight * 0.4,       // Midden: 40% open (default)
        maxHeight * 0.9        // Hoog: 90% open
      ]}
      blocking={false}
      expandOnContentDrag={true}
      className="bottom-sheet-glass"
    >
      <div 
        className="glass-card rounded-t-3xl h-full cursor-pointer" 
        onClick={onClick}
      >
        {children}
      </div>
    </ReactSpringBottomSheet>
  );
});

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;