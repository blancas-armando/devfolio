import React, { useState, useEffect, useRef } from 'react';
import { render } from 'ink-testing-library';
import { Box, Text } from 'ink';

/**
 * Simple hook testing utility for Ink/React 18
 * Renders a component that uses the hook and tracks its return values
 */
export function testHook<T>(useHook: () => T): {
  result: { current: T };
  rerender: () => void;
  unmount: () => void;
} {
  let currentValue: T;
  const renderCount = { value: 0 };

  function TestComponent() {
    const hookResult = useHook();
    currentValue = hookResult;
    renderCount.value++;
    return <Text>Test</Text>;
  }

  const { rerender, unmount } = render(<TestComponent />);

  return {
    result: {
      get current() {
        return currentValue;
      },
    },
    rerender: () => rerender(<TestComponent />),
    unmount,
  };
}

/**
 * Async act helper for Ink
 */
export async function actAsync(callback: () => Promise<void>): Promise<void> {
  await callback();
  // Give React time to process updates
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Sync act helper for Ink
 */
export function actSync(callback: () => void): void {
  callback();
}
