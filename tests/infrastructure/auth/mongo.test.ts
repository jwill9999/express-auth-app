import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';

describe('connectDB', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call mongoose.connect with the provided URI', async () => {
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as never);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { connectDB } = await import('../../../src/infrastructure/auth/database/mongo.js');
    await connectDB('mongodb://localhost:27017/testdb');

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
    expect(consoleSpy).toHaveBeenCalledWith('MongoDB connected successfully');
  });

  it('should propagate errors from mongoose.connect', async () => {
    vi.spyOn(mongoose, 'connect').mockRejectedValue(new Error('Connection refused'));

    const { connectDB } = await import('../../../src/infrastructure/auth/database/mongo.js');

    await expect(connectDB('mongodb://bad-host/db')).rejects.toThrow('Connection refused');
  });
});
