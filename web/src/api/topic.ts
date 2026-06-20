import client from './client'

export interface TopicVO {
  date: string
  title: string
  prompt: string
  tag: string  // '#今日话题'
}

export const topicApi = {
  today: () => client.get<TopicVO>('/topics/today') as unknown as Promise<TopicVO>,
}
