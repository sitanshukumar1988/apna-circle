'use client';
import { useEffect } from 'react';

export default function DisableContextMenu() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Agar Input ya Textarea hai (jahan type karte hain), toh menu aane do
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      // Baaki poori app me long-press/right-click band kar do
      e.preventDefault();
    };

    const handleSelectStart = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      // Text ko blue highlight hone se rokta hai
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  return null; 
            }
