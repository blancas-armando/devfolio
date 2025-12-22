/**
 * Stagger Animation Component
 *
 * Animate children with cascading delays
 * for polished list reveals.
 */

import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text } from 'ink';
import { timing } from '../../design/timing.js';

// ═══════════════════════════════════════════════════════════════════════════
// Stagger Component
// ═══════════════════════════════════════════════════════════════════════════

export interface StaggerProps {
  /** Children to animate */
  children: React.ReactNode[];
  /** Delay between each child (ms) */
  delay?: number;
  /** Animation type */
  animation?: 'fade' | 'slide' | 'none';
  /** Direction for slide animation */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Whether to play animation */
  enabled?: boolean;
  /** Initial delay before starting (ms) */
  initialDelay?: number;
}

export function Stagger({
  children,
  delay = timing.staggerNormal,
  animation = 'fade',
  direction = 'up',
  enabled = true,
  initialDelay = 0,
}: StaggerProps): React.ReactElement {
  const [visibleCount, setVisibleCount] = useState(enabled ? 0 : children.length);

  useEffect(() => {
    if (!enabled) {
      setVisibleCount(children.length);
      return;
    }

    // Initial delay
    const initialTimer = setTimeout(() => {
      // Then stagger reveal
      const intervalTimer = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= children.length) {
            clearInterval(intervalTimer);
            return prev;
          }
          return prev + 1;
        });
      }, delay);

      return () => clearInterval(intervalTimer);
    }, initialDelay);

    return () => clearTimeout(initialTimer);
  }, [children.length, delay, enabled, initialDelay]);

  if (animation === 'none' || !enabled) {
    return <InkBox flexDirection="column">{children}</InkBox>;
  }

  return (
    <InkBox flexDirection="column">
      {children.map((child, index) => {
        const isVisible = index < visibleCount;

        if (!isVisible) return null;

        return (
          <InkBox key={index}>
            {child}
          </InkBox>
        );
      })}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FadeIn Component
// ═══════════════════════════════════════════════════════════════════════════

export interface FadeInProps {
  /** Content to fade in */
  children: React.ReactNode;
  /** Delay before showing (ms) */
  delay?: number;
  /** Whether visible */
  visible?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  visible = true,
}: FadeInProps): React.ReactElement {
  const [show, setShow] = useState(delay === 0 && visible);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }

    if (delay === 0) {
      setShow(true);
      return;
    }

    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay, visible]);

  if (!show) return <></>;
  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Reveal Component (typewriter-style)
// ═══════════════════════════════════════════════════════════════════════════

export interface RevealProps {
  /** Text to reveal */
  text: string;
  /** Speed per character (ms) */
  speed?: number;
  /** Whether to animate */
  animate?: boolean;
  /** Callback when complete */
  onComplete?: () => void;
  /** Text color */
  color?: string;
}

export function Reveal({
  text,
  speed = timing.typewriterNormal,
  animate = true,
  onComplete,
  color,
}: RevealProps): React.ReactElement {
  const [displayedLength, setDisplayedLength] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) {
      setDisplayedLength(text.length);
      return;
    }

    if (displayedLength >= text.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedLength(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [text.length, displayedLength, speed, animate, onComplete]);

  const displayedText = text.slice(0, displayedLength);

  return <Text color={color}>{displayedText}</Text>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pulse Component
// ═══════════════════════════════════════════════════════════════════════════

export interface PulseProps {
  /** Content to pulse */
  children: React.ReactNode;
  /** Pulse interval (ms) */
  interval?: number;
  /** Whether pulsing */
  active?: boolean;
  /** Dim color for pulse */
  dimColor?: string;
}

export function Pulse({
  children,
  interval = 800,
  active = true,
}: PulseProps): React.ReactElement {
  const [bright, setBright] = useState(true);

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setBright(prev => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, active]);

  return (
    <InkBox>
      <Text dimColor={!bright}>{children}</Text>
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Cycle Component (rotate through states)
// ═══════════════════════════════════════════════════════════════════════════

export interface CycleProps<T> {
  /** Values to cycle through */
  values: T[];
  /** Interval between changes (ms) */
  interval?: number;
  /** Render function */
  render: (value: T, index: number) => React.ReactNode;
  /** Whether cycling is active */
  active?: boolean;
}

export function Cycle<T>({
  values,
  interval = 1000,
  render,
  active = true,
}: CycleProps<T>): React.ReactElement {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || values.length <= 1) return;

    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % values.length);
    }, interval);

    return () => clearInterval(timer);
  }, [values.length, interval, active]);

  return <>{render(values[index], index)}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// AnimatedList Component
// ═══════════════════════════════════════════════════════════════════════════

export interface AnimatedListProps<T> {
  /** Items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string;
  /** Stagger delay between items */
  staggerDelay?: number;
  /** Whether to animate */
  animate?: boolean;
}

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor = (_, i) => String(i),
  staggerDelay = timing.staggerNormal,
  animate = true,
}: AnimatedListProps<T>): React.ReactElement {
  const rendered = items.map((item, i) => renderItem(item, i));

  return (
    <Stagger delay={staggerDelay} enabled={animate}>
      {rendered}
    </Stagger>
  );
}
