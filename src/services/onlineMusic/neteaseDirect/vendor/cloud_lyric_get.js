// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 获取云盘歌词
import createOption from '../options';
export default (query, request) => {
  const data = {
    userId: query.uid,
    songId: query.sid,
    lv: -1,
    kv: -1,
  }
  return request(`/api/cloud/lyric/get`, data, createOption(query, 'eapi'))
}
