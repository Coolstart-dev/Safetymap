import React, { forwardRef } from 'react';
import { BottomSheet as ReactSpringBottomSheet, BottomSheetRef } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';

interface BottomSheetProps {
  children: React.ReactNode;
  open?: boolean;
  onDismiss?: () => void;
  defaultSnap?: number;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(({ 
  children, 
  open = true,
  onDismiss,
  defaultSnap
}: BottomSheetProps, ref) => {
  return (
    <ReactSpringBottomSheet 
      ref={ref}
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
      className="bottom-sheet-shadow"
    >
      <div className="p-0">
        {children}
      </div>
    </ReactSpringBottomSheet>
  );
});

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;