import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState, useCallback, memo } from 'react';
import { render } from 'ink-testing-library';
import { Box, Text } from 'ink';

/**
 * This test file investigates rerender behavior during typing.
 * We simulate the App component structure to identify the issue.
 */

// Track render counts
const renderCounts = {
  App: 0,
  Dashboard: 0,
  Footer: 0,
};

function resetRenderCounts() {
  renderCounts.App = 0;
  renderCounts.Dashboard = 0;
  renderCounts.Footer = 0;
}

// Mock Dashboard - should NOT rerender during typing
const MockDashboard = memo(function MockDashboard({
  watchlistSymbols,
  portfolio,
  onRefresh,
}: {
  watchlistSymbols: string[];
  portfolio: { totalValue: number };
  onRefresh: () => void;
}) {
  renderCounts.Dashboard++;
  return <Text>Dashboard (renders: {renderCounts.Dashboard})</Text>;
});

// Mock Footer - WILL rerender during typing (expected)
const MockFooter = memo(function MockFooter({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
}) {
  renderCounts.Footer++;
  return <Text>Footer: {value} (renders: {renderCounts.Footer})</Text>;
});

// Simulated App component structure
function SimulatedApp() {
  renderCounts.App++;

  const [inputValue, setInputValue] = useState('');
  const [watchlist] = useState(['AAPL', 'NVDA']);
  const [portfolio] = useState({ totalValue: 10000 });

  // This callback should be stable
  const handleRefresh = useCallback(() => {
    // refresh logic
  }, []);

  // This callback should be stable
  const handleSubmit = useCallback((input: string) => {
    console.log('Submit:', input);
  }, []);

  // This callback should be stable
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return (
    <Box flexDirection="column">
      <Text>App (renders: {renderCounts.App})</Text>
      <MockDashboard
        watchlistSymbols={watchlist}
        portfolio={portfolio}
        onRefresh={handleRefresh}
      />
      <MockFooter
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}

describe('App Rerender Behavior', () => {
  beforeEach(() => {
    resetRenderCounts();
  });

  it('Dashboard should NOT rerender when parent rerenders with same props', () => {
    const { rerender } = render(<SimulatedApp />);

    // Initial render
    expect(renderCounts.App).toBe(1);
    expect(renderCounts.Dashboard).toBe(1);
    expect(renderCounts.Footer).toBe(1);

    // Simulate parent rerender
    // Note: ink-testing-library's rerender re-mounts rather than updates,
    // so we're testing that memo works correctly on re-mount with same props
    rerender(<SimulatedApp />);

    // App rerenders
    expect(renderCounts.App).toBe(2);
    // Dashboard should NOT rerender (memoized, props unchanged)
    expect(renderCounts.Dashboard).toBe(1);
    // Footer also should not rerender (memoized, same callbacks)
    // Note: In real typing scenario, Footer WOULD rerender because value changes
    expect(renderCounts.Footer).toBe(1);
  });

  it('verifies callback stability with useCallback', () => {
    let firstRefresh: () => void;
    let firstSubmit: (v: string) => void;
    let firstOnChange: (v: string) => void;

    function CallbackChecker() {
      const [inputValue, setInputValue] = useState('');

      const handleRefresh = useCallback(() => {}, []);
      const handleSubmit = useCallback((input: string) => {}, []);
      const handleInputChange = useCallback((value: string) => {
        setInputValue(value);
      }, []);

      if (!firstRefresh) {
        firstRefresh = handleRefresh;
        firstSubmit = handleSubmit;
        firstOnChange = handleInputChange;
      }

      return (
        <Box flexDirection="column">
          <Text>
            Refresh stable: {String(handleRefresh === firstRefresh)}
          </Text>
          <Text>
            Submit stable: {String(handleSubmit === firstSubmit)}
          </Text>
          <Text>
            OnChange stable: {String(handleInputChange === firstOnChange)}
          </Text>
        </Box>
      );
    }

    const { lastFrame, rerender } = render(<CallbackChecker />);

    // After first render
    expect(lastFrame()).toContain('Refresh stable: true');
    expect(lastFrame()).toContain('Submit stable: true');
    expect(lastFrame()).toContain('OnChange stable: true');

    // After rerender, callbacks should still be the same
    rerender(<CallbackChecker />);

    expect(lastFrame()).toContain('Refresh stable: true');
    expect(lastFrame()).toContain('Submit stable: true');
    expect(lastFrame()).toContain('OnChange stable: true');
  });
});

describe('Identifying Rerender Source', () => {
  it('tests if new array reference causes Dashboard rerender', () => {
    let dashboardRenders = 0;

    const TestDashboard = memo(function TestDashboard({
      symbols,
    }: {
      symbols: string[];
    }) {
      dashboardRenders++;
      return <Text>Renders: {dashboardRenders}</Text>;
    });

    function TestApp() {
      const [, forceUpdate] = useState(0);
      // BUG: Creating new array on every render!
      const symbols = ['AAPL', 'NVDA'];

      return (
        <Box flexDirection="column">
          <TestDashboard symbols={symbols} />
          <Text
            // @ts-ignore
            onClick={() => forceUpdate((n) => n + 1)}
          >
            Click
          </Text>
        </Box>
      );
    }

    const { rerender } = render(<TestApp />);
    expect(dashboardRenders).toBe(1);

    // Rerender parent - Dashboard WILL rerender because symbols is new array!
    rerender(<TestApp />);
    expect(dashboardRenders).toBe(2); // This is the BUG - should be 1

    // This demonstrates that creating arrays inline causes rerenders
    // even with React.memo because array reference changes
  });

  it('tests if useState preserves array reference', () => {
    let dashboardRenders = 0;

    const TestDashboard = memo(function TestDashboard({
      symbols,
    }: {
      symbols: string[];
    }) {
      dashboardRenders++;
      return <Text>Renders: {dashboardRenders}</Text>;
    });

    function TestApp() {
      const [, forceUpdate] = useState(0);
      // CORRECT: useState preserves reference
      const [symbols] = useState(['AAPL', 'NVDA']);

      return (
        <Box flexDirection="column">
          <TestDashboard symbols={symbols} />
        </Box>
      );
    }

    const { rerender } = render(<TestApp />);
    expect(dashboardRenders).toBe(1);

    // Rerender parent - Dashboard should NOT rerender
    rerender(<TestApp />);
    expect(dashboardRenders).toBe(1); // Correct - no rerender
  });
});
