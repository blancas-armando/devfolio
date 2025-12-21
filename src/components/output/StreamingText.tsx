import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette } from '../../design/tokens.js';

export interface StreamingTextProps {
  content: string;
  complete?: boolean;
  color?: string;
  cursorColor?: string;
  showCursor?: boolean;
  cursorSpeed?: number;
}

export function StreamingText({
  content,
  complete = false,
  color = palette.text,
  cursorColor = palette.accent,
  showCursor = true,
  cursorSpeed = 500,
}: StreamingTextProps): React.ReactElement {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (complete || !showCursor) {
      setCursorVisible(false);
      return;
    }

    const timer = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, cursorSpeed);

    return () => clearInterval(timer);
  }, [complete, showCursor, cursorSpeed]);

  return (
    <InkBox>
      <Text color={color} wrap="wrap">
        {content}
        {!complete && showCursor && (
          <Text color={cursorColor}>
            {cursorVisible ? '\u2588' : ' '}
          </Text>
        )}
      </Text>
    </InkBox>
  );
}

export interface StreamingContainerProps extends StreamingTextProps {
  label?: string;
  labelColor?: string;
  padding?: number;
}

export function StreamingContainer({
  label,
  labelColor = palette.accent,
  padding = 2,
  ...props
}: StreamingContainerProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1}>
      {label && (
        <InkBox marginBottom={1} marginLeft={padding}>
          <Text color={labelColor} bold>{label}</Text>
        </InkBox>
      )}
      <InkBox marginLeft={padding}>
        <StreamingText {...props} />
      </InkBox>
    </InkBox>
  );
}

export interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  color?: string;
}

export function Typewriter({
  text,
  speed = 50,
  onComplete,
  color = palette.text,
}: TypewriterProps): React.ReactElement {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    if (displayedLength >= text.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedLength(prev => prev + 1);
    }, 1000 / speed);

    return () => clearTimeout(timer);
  }, [displayedLength, text.length, speed, onComplete]);

  return (
    <StreamingText
      content={text.slice(0, displayedLength)}
      complete={displayedLength >= text.length}
      color={color}
    />
  );
}

export interface AIResponseProps {
  content: string;
  streaming?: boolean;
  role?: string;
}

export function AIResponse({
  content,
  streaming = false,
  role = 'assistant',
}: AIResponseProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1} marginBottom={1}>
      <InkBox marginLeft={2} marginBottom={1}>
        <Text color={palette.accent} dimColor>
          {role}
        </Text>
      </InkBox>
      <InkBox marginLeft={2}>
        <StreamingText
          content={content}
          complete={!streaming}
        />
      </InkBox>
    </InkBox>
  );
}
