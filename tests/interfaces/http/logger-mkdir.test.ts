import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as fs from 'fs';

// Mock fs so existsSync can be controlled before module load
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs');
  const mockedFs = {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false), // logs dir does NOT exist
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn().mockReturnValue({ write: vi.fn(), end: vi.fn() }),
  };
  // ESM default import needs explicit default export
  return { ...mockedFs, default: mockedFs };
});

vi.mock('morgan', () => {
  const mockMorgan = vi.fn().mockReturnValue(vi.fn());
  (mockMorgan as unknown as Record<string, unknown>).token = vi.fn();
  return { default: mockMorgan };
});

describe('logger middleware - mkdirSync branch', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should call mkdirSync when logs directory does not exist', async () => {
    const fsMock = await import('fs');
    vi.mocked(fsMock.mkdirSync).mockClear();

    await import('../../../src/interfaces/http/middleware/logger.js');

    expect(fsMock.mkdirSync).toHaveBeenCalled();
  });
});
