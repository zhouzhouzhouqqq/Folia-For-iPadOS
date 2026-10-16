// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 推荐歌单

import createOption from '../options';
export default (query, request) => {
  const data = {
    limit: query.limit || 30,
    // offset: query.offset || 0,
    total: true,
    n: 1000,
  }
  return request(
    `/api/personalized/playlist`,
    data,
    createOption(query, 'weapi'),
  )
}
