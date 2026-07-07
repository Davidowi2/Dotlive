/**
 * usePitch hooks — manage pitch deck state and operations.
 */

import { useCallback, useEffect, useState } from "react";
import type { PitchDeck, CreatePitchDeckInput, UpdatePitchDeckInput, LeaderboardEntry } from "@/api/pitch";
import * as pitchApi from "@/api/pitch";

export interface UsePitchDecksReturn {
  decks: PitchDeck[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * usePitchDecks — Load all pitch decks for the authenticated user's ventures.
 */
export function usePitchDecks(): UsePitchDecksReturn {
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pitchApi.listPitchDecks();
      setDecks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pitch decks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return {
    decks,
    loading,
    error,
    refetch: fetchDecks,
  };
}

export interface UseCreatePitchDeckReturn {
  loading: boolean;
  error: string | null;
  create: (data: CreatePitchDeckInput) => Promise<PitchDeck>;
}

/**
 * useCreatePitchDeck — Create a new pitch deck.
 */
export function useCreatePitchDeck(): UseCreatePitchDeckReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreatePitchDeckInput): Promise<PitchDeck> => {
    setLoading(true);
    setError(null);
    try {
      const result = await pitchApi.createPitchDeck(data);
      return result;
    } catch (err: any) {
      const message = err.message || "Failed to create pitch deck";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    create,
  };
}

export interface UseUpdatePitchDeckReturn {
  loading: boolean;
  error: string | null;
  update: (id: string, data: UpdatePitchDeckInput) => Promise<PitchDeck>;
}

/**
 * useUpdatePitchDeck — Update an existing pitch deck.
 */
export function useUpdatePitchDeck(): UseUpdatePitchDeckReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: UpdatePitchDeckInput): Promise<PitchDeck> => {
    setLoading(true);
    setError(null);
    try {
      const result = await pitchApi.updatePitchDeck(id, data);
      return result;
    } catch (err: any) {
      const message = err.message || "Failed to update pitch deck";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    update,
  };
}

export interface UseDeletePitchDeckReturn {
  loading: boolean;
  error: string | null;
  delete: (id: string) => Promise<void>;
}

/**
 * useDeletePitchDeck — Delete a pitch deck.
 */
export function useDeletePitchDeck(): UseDeletePitchDeckReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDeck = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await pitchApi.deletePitchDeck(id);
    } catch (err: any) {
      const message = err.message || "Failed to delete pitch deck";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    delete: deleteDeck,
  };
}

export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * useLeaderboard — Load pitchathon leaderboard with scores.
 */
export function useLeaderboard(pitchathonId: string): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pitchApi.getPitchathonLeaderboardEnhanced(pitchathonId);
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [pitchathonId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
}
