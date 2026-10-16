// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 用户歌单

import createOption from '../options';
export default (query, request) => {
  const data = {
    uid: query.uid,
    limit: query.limit || 30,
    offset: query.offset || 0,
    includeVideo: true,
  }
  return request(`/api/user/playlist`, data, createOption(query, 'weapi'))
}
