import { describe, it, expect } from 'vitest';
import Library from '../library.model.js';

describe('Library Model Unit Tests', () => {
  it('should validate a valid library entry', async () => {
    const entry = Library.build({
      userId: 1,
      gameId: 10,
      status: 'jogando',
      playTime: 5,
      purchasePrice: 29.90,
    });
    await expect(entry.validate()).resolves.toBeDefined();
  });

  it('should fail validation if status is invalid', async () => {
    const entry = Library.build({
      userId: 1,
      gameId: 10,
      status: 'invalid_status',
    });
    await expect(entry.validate()).rejects.toThrow();
  });

  it('should fail validation if playTime is negative', async () => {
    const entry = Library.build({
      userId: 1,
      gameId: 10,
      playTime: -1,
    });
    await expect(entry.validate()).rejects.toThrow();
  });

  it('should fail validation if purchasePrice is negative', async () => {
    const entry = Library.build({
      userId: 1,
      gameId: 10,
      purchasePrice: -5.00,
    });
    await expect(entry.validate()).rejects.toThrow();
  });
});
