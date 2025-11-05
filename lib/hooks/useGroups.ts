import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/utils/api';

export function useGroups(page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: ['groups', page, limit],
    queryFn: () => api.getGroups(page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => api.getGroup(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeleteGroup(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
