// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 收藏与取消收藏歌单
import { APP_CONF } from '../upstreamConfig';
import createOption from '../options';
export default (query, request) => {
  const path = query.t == 1 ? 'subscribe' : 'unsubscribe'
  const data = {
    id: query.id,
    ...(query.t === 1
      ? { checkToken: query.checkToken || APP_CONF.checkToken }
      : {}),
  }
  query.checkToken = 'v2' // 强制开启checkToken
  return request(`/api/playlist/${path}`, data, createOption(query, 'eapi'))
}
