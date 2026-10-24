// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 每日推荐歌单

import createOption from '../options';
export default (query, request) => {
  return request(
    `/api/v1/discovery/recommend/resource`,
    {},
    createOption(query, 'weapi'),
  )
}
