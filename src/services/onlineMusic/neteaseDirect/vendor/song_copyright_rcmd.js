// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 灰色歌曲的其他版本推荐

import createOption from '../options';
export default (query, request) => {
  const data = {
    songid: query.songid || query.id,
  }
  return request(`/api/song/copyright/rcmd`, data, createOption(query, 'eapi'))
}
