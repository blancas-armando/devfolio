// ASCII chart utilities for terminal visualization

const SPARK_BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export function generateSparkline(data: number[], width?: number): string {
  if (data.length === 0) return '';

  // Normalize data to fit width if specified
  let normalizedData = data;
  if (width && data.length > width) {
    normalizedData = resampleData(data, width);
  }

  const min = Math.min(...normalizedData);
  const max = Math.max(...normalizedData);
  const range = max - min || 1;

  return normalizedData
    .map((value) => {
      const normalized = (value - min) / range;
      const index = Math.min(
        Math.floor(normalized * (SPARK_BLOCKS.length - 1)),
        SPARK_BLOCKS.length - 1
      );
      return SPARK_BLOCKS[index];
    })
    .join('');
}

function resampleData(data: number[], targetLength: number): number[] {
  if (data.length <= targetLength) return data;

  const result: number[] = [];
  const step = data.length / targetLength;

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const slice = data.slice(start, end);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }

  return result;
}

export function generateProgressBar(
  value: number,
  max: number,
  width: number = 20
): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function generateHorizontalBar(
  percent: number,
  width: number = 30
): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
