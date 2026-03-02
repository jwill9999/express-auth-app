import { describe, it, expect } from 'vitest';

describe('swaggerSpec', () => {
  it('should export a swagger spec object with openapi version', async () => {
    const { swaggerSpec } = await import('../../../src/interfaces/http/swagger.js');

    expect(swaggerSpec).toBeDefined();
    expect(typeof swaggerSpec).toBe('object');
    expect((swaggerSpec as Record<string, unknown>).openapi).toBe('3.0.0');
  });

  it('should include API title and version in the spec', async () => {
    const { swaggerSpec } = await import('../../../src/interfaces/http/swagger.js');
    const info = (swaggerSpec as { info?: { title: string; version: string } }).info;

    expect(info?.title).toBe('Express Authentication API');
    expect(info?.version).toBe('1.0.0');
  });
});
