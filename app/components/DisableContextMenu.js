'use client';
import { useEffect } from 'react';

export default function DisableContextMenu() {
  useEffect(() => {
    // 1. Har tarah ke click/long-press par default menu block karo
    const handleContextMenu = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 2. Text selection ko shuru hone se pehle hi rok do
    const handleSelectStart = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 3. Agar browser zabardasti select kare, toh use turant cancel kar do
    const clearSelection = () => {
      const activeEl = document.activeElement;
      if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
        if (window.getSelection) {
          if (window.getSelection().empty) {  
            window.getSelection().empty();
          } else if (window.getSelection().removeAllRanges) {  
            window.getSelection().removeAllRanges();
          }
        } else if (document.selection) {  
          document.selection.empty();
        }
      }
    };

    // capture: true lagana bahut zaroori hai taaki hum browser se pehle event pakad lein
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('selectionchange', clearSelection);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('selectionchange', clearSelection);
    };
  }, []);

  return null; 
              }
