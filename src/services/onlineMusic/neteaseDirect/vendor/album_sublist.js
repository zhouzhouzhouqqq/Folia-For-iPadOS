// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 已收藏专辑列表

import createOption from '../options';
export default (query, request) => {
  const data = {
    limit: query.limit || 25,
    offset: query.offset || 0,
    total: true,
  }
  return request(`/api/album/sublist`, data, createOption(query, 'weapi'))
}
