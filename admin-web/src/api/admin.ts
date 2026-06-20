import client from './client'

/** 管理端用户详情视图 */
export interface AdminUserDetail {
  id: number
  email: string
  nickname: string
  avatarUrl?: string
  role: number
  status: number
  createdAt: string
  postCount: number
  likeReceivedTotal: number
  reportCount: number
  recentPosts: any[]
}

/** AI 摘要 + 标签响应 */
export interface AiSummaryResult {
  summary: string
  tags: string[]
}

/** 数据看板响应 */
export interface DashboardData {
  totals: {
    users: number
    posts: number
    comments: number
    reports: number
    favorites: number
    follows: number
  }
  pending: {
    pendingReports: number
    hiddenPosts: number
    bannedUsers: number
  }
  trend14d: {
    dates: string[]
    newPosts: number[]
    newUsers: number[]
    newComments: number[]
    newReports: number[]
  }
}

/** 评论视图（管理员用） */
export interface CommentRow {
  id: number
  content: string
  isAnonymous: boolean
  likeCount: number
  deleted: boolean
  createdAt: string
  authorId?: number
  authorNickname?: string
  parentId?: number | null
  replyToUserId?: number | null
  replyToNickname?: string
}

export interface CommentListResult {
  list: CommentRow[]
  total: number
}

export const adminApi = {
  // Posts
  listPosts: (params: any) => client.get('/admin/posts', { params }),
  updatePostStatus: (id: number, status: number) =>
    client.patch(`/admin/posts/${id}/status`, { status }),
  /** 触发 AI 摘要 + 标签生成；后端写入 ai_summary / ai_tags 字段并返回结果 */
  generateAiSummary: (id: number) =>
    client.post<AiSummaryResult>(`/admin/posts/${id}/summary`) as unknown as Promise<AiSummaryResult>,
  /** 列出帖子的所有评论（含已删除） */
  listComments: (postId: number, params: any) =>
    client.get<CommentListResult>(`/posts/${postId}/comments`, { params }) as unknown as Promise<CommentListResult>,
  /** 管理员删除评论 */
  deleteComment: (id: number) => client.delete<void>(`/admin/comments/${id}`) as unknown as Promise<void>,
  // Reports
  listReports: (params: any) => client.get('/admin/reports', { params }),
  /** 数据看板聚合 */
  dashboard: () =>
    client.get<DashboardData>('/admin/stats/dashboard') as unknown as Promise<DashboardData>,
  resolveReport: (id: number, action: string, postId?: number) =>
    client.patch(`/admin/reports/${id}`, { action, postId }),
  // Users
  listUsers: (params: any) => client.get('/admin/users', { params }),
  getUserDetail: (id: number) => client.get(`/admin/users/${id}`),
  listUserPosts: (id: number, params: any) =>
    client.get(`/admin/users/${id}/posts`, { params }),
  updateUserStatus: (id: number, status: number) =>
    client.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: number, role: number) =>
    client.patch(`/admin/users/${id}/role`, { role }),
}
