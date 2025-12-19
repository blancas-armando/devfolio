import { useRef, useEffect } from 'react';
import { Text } from 'ink';

interface RenderTrackerProps {
  name: string;
  enabled?: boolean;
}

/**
 * Debug component to track renders.
 * Add this inside any component to see when it rerenders.
 *
 * Usage:
 *   <RenderTracker name="Dashboard" enabled={process.env.DEBUG_RENDERS === 'true'} />
 */
export function RenderTracker({ name, enabled = false }: RenderTrackerProps) {
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    if (enabled) {
      console.log(`[RENDER] ${name} rendered (count: ${renderCount.current})`);
    }
  });

  if (!enabled) return null;

  return (
    <Text dimColor>
      [{name}: {renderCount.current}]
    </Text>
  );
}

/**
 * Hook to track renders in any component
 */
export function useRenderTracker(name: string, enabled = false): number {
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    if (enabled) {
      console.log(`[RENDER] ${name} rendered (count: ${renderCount.current})`);
    }
  });

  return renderCount.current;
}
