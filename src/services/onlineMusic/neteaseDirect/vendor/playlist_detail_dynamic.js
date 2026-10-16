// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 歌单动态信息

import createOption from '../options';
export default (query, request) => {
  const data = {
    id: query.id,
    n: 100000,
    s: query.s || 8,
  }
  return request(`/api/playlist/detail/dynamic`, data, createOption(query))
}
