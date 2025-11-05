import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/utils/api';

export function usePlaces(page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: ['places', page, limit],
    queryFn: () => api.getPlaces(page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: () => api.getPlace(id),
    enabled: !!id,
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.createPlace(data),
    onSuccess: () => {
      // Invalidate and refetch places list
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export function useUpdatePlace(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updatePlace(id, data),
    onSuccess: () => {
      // Invalidate specific place and places list
      queryClient.invalidateQueries({ queryKey: ['place', id] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export function useDeletePlace(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.deletePlace(id),
    onSuccess: () => {
      // Invalidate places list
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}
