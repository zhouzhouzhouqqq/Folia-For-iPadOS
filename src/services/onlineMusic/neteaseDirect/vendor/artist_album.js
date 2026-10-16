// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 歌手专辑列表

import createOption from '../options';
export default (query, request) => {
  const data = {
    limit: query.limit || 30,
    offset: query.offset || 0,
    total: true,
  }
  return request(
    `/api/artist/albums/${query.id}`,
    data,
    createOption(query, 'weapi'),
  )
}
