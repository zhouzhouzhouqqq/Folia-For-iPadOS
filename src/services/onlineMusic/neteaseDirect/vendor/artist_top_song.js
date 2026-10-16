// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 歌手热门 50 首歌曲
import createOption from '../options';
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(`/api/artist/top/song`, data, createOption(query, 'weapi'))
}
