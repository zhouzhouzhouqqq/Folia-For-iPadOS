// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 每日推荐歌曲

import createOption from '../options';
export default (query, request) => {
  const data = {
    afresh: query.afresh,
  }
  return request(
    `/api/v3/discovery/recommend/songs`,
    data,
    createOption(query, 'weapi'),
  )
}
