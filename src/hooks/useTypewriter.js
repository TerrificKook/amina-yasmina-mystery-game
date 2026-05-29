import { useEffect, useState } from 'react';

export function useTypewriter(text, speed = 18) {
  const [shownText, setShownText] = useState('');

  useEffect(() => {
    let index = 0;
    setShownText('');

    if (!text) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      index += 1;
      setShownText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return shownText;
}
