// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 喜欢的歌曲(无序)

import createOption from '../options';
export default (query, request) => {
  const data = {
    uid: query.uid,
  }
  return request(`/api/song/like/get`, data, createOption(query))
}
