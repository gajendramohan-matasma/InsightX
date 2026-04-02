"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DataCube, DataCubeData } from "@/lib/types/data-cubes";

export function useDataCubes() {
  return useQuery<DataCube[]>({
    queryKey: ["data-cubes"],
    queryFn: () => apiClient.get<DataCube[]>("data-cubes/"),
    refetchInterval: 60_000,
  });
}

export function useDataCubeData(cubeId: string | null, limit = 20, offset = 0) {
  return useQuery<DataCubeData>({
    queryKey: ["data-cubes", cubeId, "data", limit, offset],
    queryFn: () =>
      apiClient.get<DataCubeData>(`data-cubes/${cubeId}/data`, {
        params: { limit, offset },
      }),
    enabled: !!cubeId,
  });
}

export function useRefreshDataCube() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cubeId: string) =>
      apiClient.post<DataCube>(`data-cubes/${cubeId}/refresh`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-cubes"] });
    },
  });
}

export function useSeedDataCubes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<DataCube[]>("data-cubes/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-cubes"] });
    },
  });
}
