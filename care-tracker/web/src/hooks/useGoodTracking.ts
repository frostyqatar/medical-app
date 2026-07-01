import { useCallback, useEffect, useState } from 'react';
import { fetchGoodTracking, createGoodTracking, updateGoodTracking, deleteGoodTracking } from '@/api';
import type { GoodTracking } from '@/api';

export function useGoodTracking(days?: number) {
  const [items, setItems] = useState<GoodTracking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    try {
      const data = await fetchGoodTracking(days);
      setItems(data);
      setError(null);
    } catch {
      setError('Failed to load notes');
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(note: string) {
    try {
      await createGoodTracking({ note, created_at: new Date().toISOString() });
      await load();
      return true;
    } catch {
      setError('Failed to add note');
      return false;
    }
  }

  async function update(id: number, note: string) {
    try {
      await updateGoodTracking(id, { note });
      await load();
      return true;
    } catch {
      setError('Failed to save note');
      return false;
    }
  }

  async function remove(id: number) {
    try {
      await deleteGoodTracking(id);
      await load();
      return true;
    } catch {
      setError('Failed to delete note');
      return false;
    }
  }

  return { items, error, reload: load, create, update, remove };
}
