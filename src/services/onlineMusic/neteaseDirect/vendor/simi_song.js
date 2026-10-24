// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 相似歌曲

import createOption from '../options';
export default (query, request) => {
  const data = {
    songid: query.id,
    limit: query.limit || 50,
    offset: query.offset || 0,
  }
  return request(
    `/api/v1/discovery/simiSong`,
    data,
    createOption(query, 'weapi'),
  )
}
