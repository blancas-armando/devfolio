import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type {
  OutputBlock as OutputBlockType,
  TextOutputBlock,
  ComponentOutputBlock,
  StreamingOutputBlock,
  ErrorOutputBlock,
  CommandEchoBlock,
} from '../../app/types.js';
import { StreamingText } from './StreamingText.js';
import { ErrorMessage, CommandEcho } from './MessageBlock.js';
import { palette } from '../../design/tokens.js';

interface TextBlockProps {
  block: TextOutputBlock;
}

const styleColors: Record<TextOutputBlock['style'] & string, string> = {
  normal: palette.text,
  dim: palette.textTertiary,
  success: palette.positive,
  error: palette.negative,
  warning: palette.warning,
  info: palette.info,
};

function TextBlock({ block }: TextBlockProps): React.ReactElement {
  const color = styleColors[block.style || 'normal'];

  return (
    <InkBox marginTop={1} marginLeft={2}>
      <Text color={color} wrap="wrap">{block.content}</Text>
    </InkBox>
  );
}

interface ComponentBlockProps {
  block: ComponentOutputBlock;
}

function ComponentBlock({ block }: ComponentBlockProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1}>
      {block.label && (
        <InkBox marginLeft={2} marginBottom={1}>
          <Text color={palette.textSecondary} dimColor>{block.label}</Text>
        </InkBox>
      )}
      {block.component}
    </InkBox>
  );
}

interface StreamingBlockProps {
  block: StreamingOutputBlock;
}

function StreamingBlock({ block }: StreamingBlockProps): React.ReactElement {
  return (
    <InkBox marginTop={1} marginLeft={2}>
      <StreamingText
        content={block.content}
        complete={block.complete}
      />
    </InkBox>
  );
}

interface ErrorBlockProps {
  block: ErrorOutputBlock;
}

function ErrorBlock({ block }: ErrorBlockProps): React.ReactElement {
  return (
    <ErrorMessage
      message={block.message}
      suggestions={block.suggestions}
      tryCommands={block.tryCommands}
    />
  );
}

interface CommandEchoBlockProps {
  block: CommandEchoBlock;
}

function CommandEchoBlockRenderer({ block }: CommandEchoBlockProps): React.ReactElement {
  return <CommandEcho command={block.command} />;
}

export interface OutputBlockProps {
  block: OutputBlockType;
}

export function OutputBlock({ block }: OutputBlockProps): React.ReactElement {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'component':
      return <ComponentBlock block={block} />;
    case 'streaming':
      return <StreamingBlock block={block} />;
    case 'error':
      return <ErrorBlock block={block} />;
    case 'command-echo':
      return <CommandEchoBlockRenderer block={block} />;
    default:
      return <></>;
  }
}

export interface OutputStreamProps {
  blocks: OutputBlockType[];
  streamingContent?: string | null;
  isStreaming?: boolean;
}

export function OutputStream({
  blocks,
  streamingContent,
  isStreaming = false,
}: OutputStreamProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      {blocks.map(block => (
        <OutputBlock key={block.id} block={block} />
      ))}

      {isStreaming && streamingContent && (
        <InkBox marginTop={1} marginLeft={2}>
          <StreamingText content={streamingContent} complete={false} />
        </InkBox>
      )}
    </InkBox>
  );
}
