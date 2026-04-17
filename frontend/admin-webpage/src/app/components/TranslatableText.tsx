import { useEffect, useState } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';

interface TranslatableTextProps {
  children: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Component that automatically translates text based on current language
 * Usage: <TranslatableText>Your text here</TranslatableText>
 */
export function TranslatableText({
  children,
  className = '',
  as: Component = 'span'
}: TranslatableTextProps) {
  const { language, useGoogleTranslate, translateText } = useLanguage();
  const [displayText, setDisplayText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language === 'en' || !useGoogleTranslate) {
      setDisplayText(children);
      return;
    }

    setIsLoading(true);
    translateText(children)
      .then(result => {
        setDisplayText(result);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Translation error:', error);
        setDisplayText(children);
        setIsLoading(false);
      });
  }, [children, language, useGoogleTranslate, translateText]);

  const opacity = isLoading ? 'opacity-70' : 'opacity-100';

  return (
    <Component className={`${className} ${opacity} transition-opacity`}>
      {displayText}
    </Component>
  );
}

/**
 * Hook for translating text in functional components
 * Usage: const translated = useTranslateText('Your text');
 */
export function useTranslateText(text: string): string {
  const { language, useGoogleTranslate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language === 'en' || !useGoogleTranslate) {
      setTranslatedText(text);
      return;
    }

    setIsLoading(true);
    translateText(text, language)
      .then(result => {
        setTranslatedText(result.text);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Translation error:', error);
        setTranslatedText(text);
        setIsLoading(false);
      });
  }, [text, language, useGoogleTranslate]);

  return translatedText;
}
