import { useCallback, useEffect, useState } from 'react';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '@/api';
import type { Plan } from '@/api';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPlans(null);
    try {
      const data = await fetchPlans();
      setPlans(data);
      setError(null);
    } catch {
      setError('Failed to load plans');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(input: { title: string; content?: string; color: string }) {
    try {
      await createPlan(input);
      await load();
      return true;
    } catch {
      setError('Failed to create plan');
      return false;
    }
  }

  async function update(id: number, input: { title: string; content: string; color: string }) {
    try {
      await updatePlan(id, input);
      await load();
      return true;
    } catch {
      setError('Failed to update plan');
      return false;
    }
  }

  async function remove(id: number) {
    try {
      await deletePlan(id);
      await load();
      return true;
    } catch {
      setError('Failed to delete plan');
      return false;
    }
  }

  return { plans, error, reload: load, create, update, remove };
}
