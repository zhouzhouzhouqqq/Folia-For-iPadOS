// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 歌曲详情

import createOption from '../options';
export default (query, request) => {
  // 歌曲数量不要超过1000
  query.ids = query.ids.split(/\s*,\s*/)
  const data = {
    c: '[' + query.ids.map((id) => '{"id":' + id + '}').join(',') + ']',
  }
  return request(`/api/v3/song/detail`, data, createOption(query, 'weapi'))
}
