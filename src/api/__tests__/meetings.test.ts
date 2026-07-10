import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dotApi client so we never hit the real network
vi.mock('@/api/client', () => ({
  dotApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { dotApi } from '@/api/client';
import { getAvailableSlots, getMyMeetings } from '@/api/meetings';

describe('Meetings API client — array normalization', () => {
  beforeEach(() => {
    vi.mocked(dotApi.get).mockReset();
  });

  describe('getAvailableSlots', () => {
    it('returns the array as-is when the backend returns a flat array', async () => {
      const slots = [{ id: 'a' }, { id: 'b' }];
      vi.mocked(dotApi.get).mockResolvedValue(slots);
      await expect(getAvailableSlots()).resolves.toEqual(slots);
    });

    it('unwraps `{ slots: [...] }` — the original backend shape that crashed the page', async () => {
      // Regression: T.filter is not a function
      const wrapped = { slots: [{ id: 'a' }, { id: 'b' }] };
      vi.mocked(dotApi.get).mockResolvedValue(wrapped);
      const result = await getAvailableSlots();
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
      // It must be a real array, not the wrapper object
      expect(Array.isArray(result)).toBe(true);
      // And it must support .filter() without throwing
      expect(() => result.filter((s) => s.id === 'a')).not.toThrow();
    });

    it('returns [] when the backend returns null', async () => {
      vi.mocked(dotApi.get).mockResolvedValue(null);
      const result = await getAvailableSlots();
      expect(result).toEqual([]);
      expect(() => result.filter(() => true)).not.toThrow();
    });

    it('returns [] when the backend returns an error payload object', async () => {
      vi.mocked(dotApi.get).mockResolvedValue({ error: 'Internal Server Error' });
      const result = await getAvailableSlots();
      expect(result).toEqual([]);
      expect(() => result.filter(() => true)).not.toThrow();
    });
  });

  describe('getMyMeetings', () => {
    it('returns the array as-is when the backend returns a flat array', async () => {
      const meetings = [{ id: 'm1' }];
      vi.mocked(dotApi.get).mockResolvedValue(meetings);
      await expect(getMyMeetings()).resolves.toEqual(meetings);
    });

    it('unwraps `{ meetings: [...] }` defensively', async () => {
      vi.mocked(dotApi.get).mockResolvedValue({ meetings: [{ id: 'm1' }] });
      const result = await getMyMeetings();
      expect(result).toEqual([{ id: 'm1' }]);
      expect(() => result.filter(() => true)).not.toThrow();
    });

    it('returns [] for any non-iterable response', async () => {
      vi.mocked(dotApi.get).mockResolvedValue({ error: 'oops' });
      const result = await getMyMeetings();
      expect(result).toEqual([]);
      expect(() => result.filter(() => true)).not.toThrow();
    });
  });
});
