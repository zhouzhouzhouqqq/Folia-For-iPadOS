// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 历史每日推荐歌曲详情

import createOption from '../options';
export default (query, request) => {
  const data = {
    date: query.date || '',
  }
  return request(
    `/api/discovery/recommend/songs/history/detail`,
    data,
    createOption(query, 'weapi'),
  )
}
