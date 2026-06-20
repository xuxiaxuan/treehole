import client from './client'
import type { PostList } from './post'

export interface FollowInfo {
  followerCount: number
  followingCount: number
  following: boolean
  isMe: boolean
}

export const ffApi = {
  /** 切换收藏 */
  toggleFavorite: (postId: number) =>
    client.post<{ favorited: boolean }>(`/posts/${postId}/favorite`) as unknown as Promise<{ favorited: boolean }>,

  /** 我的收藏列表 */
  myFavorites: (page = 1, size = 20) =>
    client.get<PostList>('/me/favorites', { params: { page, size } }) as unknown as Promise<PostList>,

  /** 切换关注 */
  toggleFollow: (userId: number) =>
    client.post<{ following: boolean; followerCount: number; followingCount: number }>(
      `/users/${userId}/follow`
    ) as unknown as Promise<{ following: boolean; followerCount: number; followingCount: number }>,

  /** 查询关注状态与计数 */
  followInfo: (userId: number) =>
    client.get<FollowInfo>(`/users/${userId}/follow-info`) as unknown as Promise<FollowInfo>,
}
