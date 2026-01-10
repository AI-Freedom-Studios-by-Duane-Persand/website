// frontend/components/AssetImage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import AssetUrlManager from '../lib/asset-url-manager';

interface AssetImageProps extends Omit<ImageProps, 'src'> {
  src: string; // Original asset URL
  fallback?: string; // Fallback image on error
  autoRefresh?: boolean; // Automatically refresh URL if needed (default: true)
}

export function AssetImage({
  src,
  fallback,
  autoRefresh = true,
  onError,
  ...props
}: AssetImageProps) {
  const [imageUrl, setImageUrl] = useState(src);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrlRef = useRef(imageUrl);

  useEffect(() => {
    imageUrlRef.current = imageUrl;
  }, [imageUrl]);

  // Check and refresh URL on mount
  useEffect(() => {
    if (!autoRefresh) return;
    let cancelled = false;

    const checkAndRefreshUrl = async () => {
      try {
        const freshUrl = await AssetUrlManager.getAssetUrl(src);
        if (!cancelled && freshUrl !== imageUrlRef.current) {
          setImageUrl(freshUrl);
        }
      } catch (err) {
        console.warn('Failed to refresh asset URL:', err);
      }
    };

    checkAndRefreshUrl();
    return () => { cancelled = true; };
  }, [src, autoRefresh]);

  // Handle image load error - try to refresh URL
  const handleError = useCallback(
    async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (isRefreshing) {
        setError('Failed to load asset');
        if (onError) onError(e);
        return;
      }

      try {
        setIsRefreshing(true);
        const freshUrl = await AssetUrlManager.refreshAssetUrl(src);
        setError(null);
        setImageUrl(freshUrl);
        setIsRefreshing(false);
      } catch (err) {
        console.error('Failed to refresh asset URL on error:', err);
        setError('Failed to load asset');
        setIsRefreshing(false);
        if (onError) onError(e);
      }
    },
    [src, isRefreshing, onError]
  );

  if (error && fallback) {
    return (
      <Image
        {...props}
        src={fallback}
        alt={props.alt || 'Asset'}
      />
    );
  }

  return (
    <Image
      {...props}
      src={imageUrl}
      alt={props.alt || 'Asset'}
      onError={handleError}
    />
  );
}

interface AssetVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string; // Original video URL
  autoRefresh?: boolean; // Automatically refresh URL if needed (default: true)
}

export function AssetVideo({
  src,
  autoRefresh = true,
  onError,
  ...props
}: AssetVideoProps) {
  const [videoUrl, setVideoUrl] = useState(src);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoUrlRef = useRef(videoUrl);

  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  // Check and refresh URL on mount
  useEffect(() => {
    if (!autoRefresh) return;
    let cancelled = false;

    const checkAndRefreshUrl = async () => {
      try {
        const freshUrl = await AssetUrlManager.getAssetUrl(src);
        if (!cancelled && freshUrl !== videoUrlRef.current) {
          setVideoUrl(freshUrl);
        }
      } catch (err) {
        console.warn('Failed to refresh video URL:', err);
      }
    };

    checkAndRefreshUrl();
    return () => { cancelled = true; };
  }, [src, autoRefresh]);

  // Handle video load error - try to refresh URL
  const handleError = useCallback(
    async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      if (isRefreshing) {
        setError('Failed to load video');
        if (onError) onError(e);
        return;
      }

      try {
        setIsRefreshing(true);
        const freshUrl = await AssetUrlManager.refreshAssetUrl(src);
        setError(null);
        setVideoUrl(freshUrl);
        setIsRefreshing(false);
      } catch (err) {
        console.error('Failed to refresh video URL on error:', err);
        setError('Failed to load video');
        setIsRefreshing(false);
        if (onError) onError(e);
      }
    },
    [src, isRefreshing, onError]
  );

  if (error) {
    return (
      <div className="bg-gray-100 rounded flex items-center justify-center" style={{ width: props.width, height: props.height }}>
        <span className="text-gray-500">Failed to load video</span>
      </div>
    );
  }

  return (
    <video
      {...props}
      src={videoUrl}
      onError={handleError}
    />
  );
}

// Hook for manual URL management
export function useAssetUrl(initialUrl: string, autoRefresh: boolean = true) {
  const [url, setUrl] = useState(initialUrl);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check and refresh on mount
  useEffect(() => {
    if (!autoRefresh) return;
    let cancelled = false;

    const checkAndRefresh = async () => {
      try {
        const freshUrl = await AssetUrlManager.getAssetUrl(initialUrl);
        if (!cancelled && freshUrl !== url) {
          setUrl(freshUrl);
        }
      } catch (err) {
        console.warn('Failed to refresh URL:', err);
      }
    };

    checkAndRefresh();
    return () => { cancelled = true; };
  }, [initialUrl, autoRefresh]);

  const refreshUrl = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const freshUrl = await AssetUrlManager.refreshAssetUrl(initialUrl);
      setUrl(freshUrl);
    } catch (err) {
      console.error('Failed to refresh URL:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [initialUrl]);

  const checkStatus = useCallback(async () => {
    return await AssetUrlManager.checkUrlStatus(url);
  }, [url]);

  return {
    url,
    isRefreshing,
    refreshUrl,
    checkStatus,
  };
}
