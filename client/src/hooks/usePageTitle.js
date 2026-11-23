import { useEffect } from 'react';

// Sets the browser tab title, e.g. usePageTitle('Goa trip') -> "Goa trip · SettleUp".
export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · SettleUp` : 'SettleUp';
    return () => {
      document.title = 'SettleUp';
    };
  }, [title]);
};

export default usePageTitle;
