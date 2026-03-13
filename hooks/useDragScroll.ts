import { useRef, useEffect } from 'react';

export function useDragScroll<T extends HTMLElement>(options?: { direction?: 'horizontal' | 'vertical' | 'both' }) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const slider = ref.current;
    if (!slider) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      isDragging = false;
      slider.classList.add('active');
      startX = e.pageX - slider.offsetLeft;
      startY = e.pageY - slider.offsetTop;
      scrollLeft = slider.scrollLeft;
      scrollTop = slider.scrollTop;
    };

    const onMouseLeave = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const onMouseUp = (e: MouseEvent) => {
      isDown = false;
      slider.classList.remove('active');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      
      const x = e.pageX - slider.offsetLeft;
      const y = e.pageY - slider.offsetTop;
      
      const walkX = (x - startX);
      const walkY = (y - startY);

      let isSignificantMove = false;
      if (options?.direction === 'horizontal') {
        isSignificantMove = Math.abs(walkX) > 5 && Math.abs(walkX) > Math.abs(walkY);
      } else if (options?.direction === 'vertical') {
        isSignificantMove = Math.abs(walkY) > 5 && Math.abs(walkY) > Math.abs(walkX);
      } else {
        isSignificantMove = Math.abs(walkX) > 5 || Math.abs(walkY) > 5;
      }

      if (isSignificantMove) {
        isDragging = true;
      }

      if (isDragging) {
        e.preventDefault();
        if (options?.direction !== 'vertical') {
          slider.scrollLeft = scrollLeft - walkX;
        }
        if (options?.direction !== 'horizontal') {
          slider.scrollTop = scrollTop - walkY;
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mouseleave', onMouseLeave);
    slider.addEventListener('mouseup', onMouseUp);
    slider.addEventListener('mousemove', onMouseMove);
    slider.addEventListener('click', onClick, true); // Capture phase to prevent child clicks

    return () => {
      slider.removeEventListener('mousedown', onMouseDown);
      slider.removeEventListener('mouseleave', onMouseLeave);
      slider.removeEventListener('mouseup', onMouseUp);
      slider.removeEventListener('mousemove', onMouseMove);
      slider.removeEventListener('click', onClick, true);
    };
  }, [options?.direction]);

  return ref;
}
