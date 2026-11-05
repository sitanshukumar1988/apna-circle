'use client';
import { useEffect } from 'react';

export default function DisableContextMenu() {
  useEffect(() => {
    // 1. Right click / Long press menu ko block karna
    const handleContextMenu = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 2. Agar koi text select hone ki koshish kare toh use turant cancel kar dena
    const handleSelectionChange = () => {
      const activeElement = document.activeElement;
      // Agar user input ya textarea me nahi hai, toh selection clear kar do
      if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
        if (window.getSelection) {
          if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
          } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
          }
        } else if (document.selection) {  // IE
          document.selection.empty();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  return null; 
}
