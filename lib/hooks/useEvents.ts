import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/utils/api';

export function useEvents(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['events', page, limit],
    queryFn: () => api.getEvents(page, limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => api.getEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useAttendEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.attendEvent(id),
    onSuccess: () => {
      // Invalidate both the specific event and events list
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
