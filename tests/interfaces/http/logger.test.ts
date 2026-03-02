import { describe, it, expect, vi } from 'vitest';
import type * as fs from 'fs';

// Mock fs to control file system behavior
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs');
  const mockedFs = {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn().mockReturnValue({ write: vi.fn(), end: vi.fn() }),
  };
  // ESM default import needs explicit default export
  return { ...mockedFs, default: mockedFs };
});

// Capture the morgan token callback so we can invoke it directly
let capturedTokenCallback: ((req: Record<string, unknown>, res: Record<string, unknown>) => string) | null = null;

vi.mock('morgan', () => {
  const mockMorgan = vi.fn().mockReturnValue(vi.fn());
  (mockMorgan as unknown as Record<string, unknown>).token = vi.fn().mockImplementation(
    (_name: string, cb: (req: Record<string, unknown>, res: Record<string, unknown>) => string) => {
      capturedTokenCallback = cb;
    },
  );
  return { default: mockMorgan };
});

describe('logger middleware', () => {
  it('should export console, file, and combined properties', async () => {
    const logger = (await import('../../../src/interfaces/http/middleware/logger.js')).default;

    expect(logger).toBeDefined();
    expect(typeof logger.console).toBe('function');
    expect(typeof logger.file).toBe('function');
    expect(typeof logger.combined).toBe('function');
  });

  it('should call app.use twice when combined is invoked', async () => {
    const logger = (await import('../../../src/interfaces/http/middleware/logger.js')).default;

    const mockApp = { use: vi.fn() };
    logger.combined(mockApp as never);

    expect(mockApp.use).toHaveBeenCalledTimes(2);
  });

  it('should NOT call mkdirSync when logs directory already exists', async () => {
    const fsMock = await import('fs');
    vi.mocked(fsMock.existsSync).mockReturnValue(true);
    vi.mocked(fsMock.mkdirSync).mockClear();

    await import('../../../src/interfaces/http/middleware/logger.js');

    expect(fsMock.mkdirSync).not.toHaveBeenCalled();
  });

  describe('response-time-ms custom morgan token', () => {
    it('should return "-" when req._startAt is not set', async () => {
      // Ensure the module is loaded so the token is registered
      await import('../../../src/interfaces/http/middleware/logger.js');

      expect(capturedTokenCallback).not.toBeNull();
      const result = capturedTokenCallback?.({}, {});
      expect(result).toBe('-');
    });

    it('should return "-" when res._startAt is not set', async () => {
      await import('../../../src/interfaces/http/middleware/logger.js');

      const result = capturedTokenCallback?.({ _startAt: [1000, 0] }, {});
      expect(result).toBe('-');
    });

    it('should return elapsed ms when both _startAt values are set', async () => {
      await import('../../../src/interfaces/http/middleware/logger.js');

      const result = capturedTokenCallback?.(
        { _startAt: [1000, 0] },
        { _startAt: [1000, 5_000_000] }, // 5ms difference
      );
      expect(result).toBe('5.000');
    });
  });
});
