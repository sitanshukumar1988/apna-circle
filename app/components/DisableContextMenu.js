'use client';
import { useEffect } from 'react';

export default function DisableContextMenu() {
  useEffect(() => {
    // 1. Right click / Long press par aane wale default menu ko rokna
    const handleContextMenu = (e) => {
      // Sirf input aur textarea ko chhod kar baaki sab jagah block karein
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 2. Text selection shuru hone se rokna
    const handleSelectStart = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 3. Agar browser zabardasti select karne ki koshish kare, toh use turant cancel karna
    const clearSelection = () => {
      const activeEl = document.activeElement;
      // Agar user input ya textarea me nahi hai, toh selection clear kar do
      if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
        if (window.getSelection) {
          if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
          } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
          }
        } else if (document.selection) {  // Purane browsers (IE)
          document.selection.empty();
        }
      }
    };

    // Capture: true ka matlab hai ki hum pehle event pakdenge, browser baad me
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('selectionchange', clearSelection);

    // Cleanup (jab component unmount ho)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('selectionchange', clearSelection);
    };
  }, []);

  return null; 
    }
