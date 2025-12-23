/**
 * CommandInput Component
 *
 * The main input component combining text input,
 * tab completion, and history navigation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Box as InkBox, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { InputBox, InputArea } from './InputBox.js';
import { TabCompleter, InlineCompletion } from './TabCompleter.js';
import { useTabCompletion, useHistory } from './hooks.js';
import { KeyHintGroup, keyHintPresets } from '../core/KeyHint.js';

import { palette } from '../../design/tokens.js';

// Stable hint arrays to prevent rerenders
const DEFAULT_HINTS = [keyHintPresets.submit, keyHintPresets.tab];
const EMPTY_COMPLETIONS: string[] = [];

// Check if we're in a TTY environment that supports raw mode
const isTTY = process.stdin.isTTY ?? false;

export interface CommandInputProps {
  /** Called when command is submitted */
  onSubmit: (command: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Custom symbols for completion (e.g., watchlist) */
  customSymbols?: string[];
  /** Show bordered input box */
  showBorder?: boolean;
  /** Show status hints */
  showHints?: boolean;
  /** Model name to display */
  modelName?: string;
  /** Width - use 'terminal' for full terminal width */
  width?: number | 'compact' | 'standard' | 'full' | 'terminal';
}

export function CommandInput({
  onSubmit,
  placeholder = 'Type command or ask anything...',
  disabled = false,
  customSymbols = [],
  showBorder = true,
  showHints = true,
  modelName,
  width = 'standard',
}: CommandInputProps): React.ReactElement {
  const [value, setValue] = useState('');
  const [completionIndex, setCompletionIndex] = useState(-1);
  const [showCompletions, setShowCompletions] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Hooks
  const { getCompletions } = useTabCompletion({ customSymbols });
  const { history, prev: historyPrev, next: historyNext, reset: historyReset } = useHistory();

  // Memoize completions to prevent rerenders
  const completions = useMemo(
    () => (value ? getCompletions(value) : EMPTY_COMPLETIONS),
    [value, getCompletions]
  );

  // Handle input change
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setCompletionIndex(-1);
    setShowCompletions(newValue.length > 0 && completions.length > 0);
    // Reset history navigation when typing
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
    }
  }, [completions.length, historyIndex]);

  // Handle submit
  const handleSubmit = useCallback((submittedValue: string) => {
    const trimmed = submittedValue.trim();
    if (!trimmed) return;

    onSubmit(trimmed);
    setValue('');
    setCompletionIndex(-1);
    setShowCompletions(false);
    setHistoryIndex(-1);
    setSavedInput('');
    historyReset();
  }, [onSubmit, historyReset]);

  // Keyboard handling (only active in TTY environments)
  useInput((input, key) => {
    if (disabled) return;

    // Tab - cycle completions
    if (key.tab) {
      const currentCompletions = getCompletions(value);
      if (currentCompletions.length > 0) {
        const newIndex = key.shift
          ? (completionIndex <= 0 ? currentCompletions.length - 1 : completionIndex - 1)
          : (completionIndex >= currentCompletions.length - 1 ? 0 : completionIndex + 1);
        setCompletionIndex(newIndex);
        setShowCompletions(true);

        // Apply the completion
        const completion = currentCompletions[newIndex];
        if (completion) {
          setValue(completion);
        }
      }
      return;
    }

    // Up arrow - history prev or completion prev
    if (key.upArrow) {
      if (showCompletions && completions.length > 0) {
        // Navigate completions
        const newIndex = completionIndex <= 0 ? completions.length - 1 : completionIndex - 1;
        setCompletionIndex(newIndex);
        setValue(completions[newIndex] || value);
      } else {
        // Navigate history
        if (historyIndex === -1) {
          setSavedInput(value);
        }
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setValue(history[newIndex] || '');
        }
      }
      return;
    }

    // Down arrow - history next or completion next
    if (key.downArrow) {
      if (showCompletions && completions.length > 0) {
        // Navigate completions
        const newIndex = completionIndex >= completions.length - 1 ? 0 : completionIndex + 1;
        setCompletionIndex(newIndex);
        setValue(completions[newIndex] || value);
      } else {
        // Navigate history
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setValue(history[newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setValue(savedInput);
        }
      }
      return;
    }

    // Escape - clear completions or input
    if (key.escape) {
      if (showCompletions) {
        setShowCompletions(false);
        setCompletionIndex(-1);
      } else if (value) {
        setValue('');
      }
      return;
    }
  }, { isActive: isTTY });

  // Build status hints (using stable array reference)
  const statusLeft = showHints ? (
    <KeyHintGroup hints={DEFAULT_HINTS} />
  ) : null;

  const statusRight = modelName ? (
    <Text color={palette.textTertiary}>{modelName}</Text>
  ) : null;

  return (
    <InkBox flexDirection="column">
      {/* Tab completions */}
      <TabCompleter
        completions={completions}
        selectedIndex={completionIndex}
        visible={showCompletions && completions.length > 0}
      />

      {/* Input area */}
      <InputArea
        width={width}
        showBorder={showBorder}
        statusLeft={statusLeft}
        statusRight={statusRight}
      >
        <InkBox flexGrow={1}>
          {value ? (
            <TextInput
              value={value}
              onChange={handleChange}
              onSubmit={handleSubmit}
              placeholder=""
            />
          ) : (
            <>
              <TextInput
                value={value}
                onChange={handleChange}
                onSubmit={handleSubmit}
                placeholder=""
              />
              <Text color={palette.textTertiary}>{placeholder}</Text>
            </>
          )}
        </InkBox>
      </InputArea>
    </InkBox>
  );
}

// Simple input without box (for inline use)
export interface SimpleInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  prompt?: string;
}

export function SimpleInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  prompt = '>',
}: SimpleInputProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={palette.accent} bold>{prompt}</Text>
      <Text> </Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={placeholder}
      />
    </InkBox>
  );
}
