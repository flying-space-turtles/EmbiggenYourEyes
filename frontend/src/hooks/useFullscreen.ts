import { useEffect, useCallback } from 'react';
import { Viewer } from 'cesium';

interface UseFullscreenProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewer: React.RefObject<Viewer | null>;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}

export const useFullscreen = ({
  containerRef,
  viewer,
  isFullscreen,
  setIsFullscreen,
}: UseFullscreenProps) => {
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [isFullscreen, containerRef]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const newFullscreenState = !!document.fullscreenElement;
      setIsFullscreen(newFullscreenState);
      
      // Resize Cesium viewer when fullscreen changes
      if (viewer.current) {
        setTimeout(() => {
          viewer.current?.resize();
        }, 100);
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'F' or 'f' to toggle fullscreen
      if (e.key === 'f' || e.key === 'F') {
        if (containerRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // Press Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen, toggleFullscreen, containerRef, viewer, setIsFullscreen]);

  return { toggleFullscreen };
};