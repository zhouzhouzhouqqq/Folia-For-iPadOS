// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 新版歌词 - 包含逐字歌词

import createOption from '../options';
export default (query, request) => {
  const data = {
    id: query.id,
    cp: false,
    tv: 0,
    lv: 0,
    rv: 0,
    kv: 0,
    yv: 0,
    ytv: 0,
    yrv: 0,
  }
  return request(`/api/song/lyric/v1`, data, createOption(query))
}
