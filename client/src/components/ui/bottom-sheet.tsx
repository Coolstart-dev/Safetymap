import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

export type SnapPosition = 'low' | 'medium' | 'high';

interface BottomSheetProps {
  children: React.ReactNode;
  defaultPosition?: SnapPosition;
  onPositionChange?: (position: SnapPosition) => void;
}

export default function BottomSheet({ 
  children, 
  defaultPosition = 'medium',
  onPositionChange 
}: BottomSheetProps) {
  const [currentPosition, setCurrentPosition] = useState<SnapPosition>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const constraintsRef = useRef(null);

  // Snap points (percentage from top of screen)
  const snapPoints = {
    high: '10vh',    // Bijna volledig scherm
    medium: '50vh',  // Half scherm
    low: '90vh'      // Alleen grip balkje zichtbaar
  };

  const getSnapValue = (position: SnapPosition) => {
    const vh = window.innerHeight / 100;
    switch (position) {
      case 'high': return vh * 10;
      case 'medium': return vh * 50;
      case 'low': return vh * 90;
    }
  };

  const snapToPosition = useCallback(async (position: SnapPosition) => {
    const snapValue = getSnapValue(position);
    await controls.start({ y: snapValue });
    setCurrentPosition(position);
    onPositionChange?.(position);
  }, [controls, onPositionChange]);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const currentY = getSnapValue(currentPosition) + offset.y;
    
    // Bepaal naar welke positie we moeten snappen
    let targetPosition: SnapPosition = currentPosition;
    
    // Als er veel velocity is, snap naar die richting
    if (Math.abs(velocity.y) > 500) {
      targetPosition = velocity.y > 0 ? 
        (currentPosition === 'high' ? 'medium' : 'low') :
        (currentPosition === 'low' ? 'medium' : 'high');
    } else {
      // Anders naar dichtstbijzijnde snap point
      const vh = window.innerHeight / 100;
      const distanceToHigh = Math.abs(currentY - vh * 10);
      const distanceToMedium = Math.abs(currentY - vh * 50);
      const distanceToLow = Math.abs(currentY - vh * 90);
      
      if (distanceToHigh <= distanceToMedium && distanceToHigh <= distanceToLow) {
        targetPosition = 'high';
      } else if (distanceToMedium <= distanceToLow) {
        targetPosition = 'medium';
      } else {
        targetPosition = 'low';
      }
    }
    
    snapToPosition(targetPosition);
  }, [currentPosition, snapToPosition]);

  useEffect(() => {
    snapToPosition(defaultPosition);
  }, [defaultPosition, snapToPosition]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      snapToPosition(currentPosition);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPosition, snapToPosition]);

  return (
    <div 
      ref={constraintsRef} 
      className="fixed inset-0 pointer-events-none z-50"
    >
      <motion.div
        className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl pointer-events-auto"
        style={{ 
          height: '100vh',
          top: snapPoints[defaultPosition]
        }}
        animate={controls}
        drag="y"
        dragConstraints={{ top: getSnapValue('high'), bottom: getSnapValue('low') }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300
        }}
      >
        {/* Grip Handle */}
        <div 
          className="w-full py-3 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            // Ensure grip area is draggable
            e.preventDefault();
          }}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto"></div>
        </div>
        
        {/* Content Area */}
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Hook voor eenvoudige controle van bottom sheet
export function useBottomSheet(defaultPosition: SnapPosition = 'medium') {
  const [position, setPosition] = useState<SnapPosition>(defaultPosition);
  
  const goToPosition = useCallback((newPosition: SnapPosition) => {
    setPosition(newPosition);
  }, []);
  
  return {
    position,
    setPosition: goToPosition
  };
}