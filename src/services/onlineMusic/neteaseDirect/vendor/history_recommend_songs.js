// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 历史每日推荐歌曲

import createOption from '../options';
export default (query, request) => {
  const data = {}
  return request(
    `/api/discovery/recommend/songs/history/recent`,
    data,
    createOption(query, 'weapi'),
  )
}
