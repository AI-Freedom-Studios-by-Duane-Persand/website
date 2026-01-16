import { apiClient } from './client';

export interface StorageUploadResponse {
  url: string;
}

export const storageApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<StorageUploadResponse>('/storage/upload', formData);
  },
};
