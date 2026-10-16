// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 每日推荐歌曲-不感兴趣
import createOption from '../options';
export default (query, request) => {
  const data = {
    resId: query.id, // 日推歌曲id
    resType: 4,
    sceneType: 1,
  }
  return request(
    `/api/v2/discovery/recommend/dislike`,
    data,
    createOption(query, 'weapi'),
  )
}
