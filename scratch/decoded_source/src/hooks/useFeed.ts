import { useState, useEffect, useCallback } from 'react';
import { Post, Comment, FeedContext } from '@/types/feed';
import { feedService } from '@/lib/firebase/feedService';
import { useLocation } from '@/components/providers/LocationProvider';

export const useFeed = (context: FeedContext) => {
  const { location: selectedLocation } = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // targetId 도출 (e.g. "plaza", "abc123_group_id")
  const targetId = context.scope === 'plaza' ? 'plaza' : context.scopeId;
  const currentCategory = context.category || (context.scope === 'plaza' ? context.scopeId : undefined);

  // 초기 실시간 구독
  useEffect(() => {
    setLoading(true);
    
    // 위치 필터 및 카테고리 필터 적용
    const filters = {
      city: selectedLocation.city,
      category: currentCategory
    };

    const unsubscribe = feedService.subscribePosts(targetId, (newPosts) => {
      setPosts(newPosts);
      setLoading(false);
      setError(null);
    }, filters, (err) => {
      console.error("Subscription error:", err);
      setLoading(false);
      setError("Failed to load feed. Indexes may still be building.");
    });

    return () => unsubscribe();
  }, [targetId, selectedLocation.city, currentCategory]);

  // 과거 데이터 더 불러오기
  const loadMore = async () => {
    if (!hasMore || loading) return;
    
    try {
      setLoading(true);
      const filters = {
        city: selectedLocation.city,
        category: currentCategory
      };

      const result = await feedService.getPostsPaginated(targetId, 10, lastVisible, filters);
      
      if (result.posts.length < 10) {
        setHasMore(false);
      }
      
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPosts = result.posts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPosts];
      });
      
      setLastVisible(result.lastVisible);
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (content: string, mediaItems: { url: string; type: 'image' | 'video' }[], user: any) => {
    if (!content.trim() && (!mediaItems || mediaItems.length === 0)) return;
    
    // 1. targets: 현재 scope가 plaza이면 ['plaza', scopeId] 필수 포함
    const targets = context.scope === 'plaza' 
      ? ['plaza', context.scopeId] 
      : [context.scopeId || 'freestyle-tango'];
    
    // 2. category: 컨텍스트에 정의된 카테고리 또는 scopeId
    const category = currentCategory || (context.scopeId?.toUpperCase()) || 'SOCIAL';

    // 3. location: LocationProvider에서 제공하는 현재 위치
    const location = {
      country: selectedLocation.country,
      city: selectedLocation.city
    };

    return await feedService.createPost({
      content,
      media: mediaItems,
      targets,
      category,
      location,
      userId: user.uid || user.id,
      userName: user.displayName || user.name || 'Anonymous',
      userPhoto: user.photoURL || user.avatar || '',
    });
  };

  const likePost = async (postId: string, isLike: boolean) => {
    await feedService.likePost(postId, isLike);
  };

  const addComment = async (postId: string, content: string, user: any) => {
    await feedService.addComment(postId, {
      content,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
    });
  };

  const deletePost = async (postId: string) => {
    await feedService.deletePost(postId);
  };

  const deleteComment = async (postId: string, commentId: string) => {
    await feedService.deleteComment(postId, commentId);
  };

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    likePost,
    addComment,
    deletePost,
    deleteComment
  };
};
