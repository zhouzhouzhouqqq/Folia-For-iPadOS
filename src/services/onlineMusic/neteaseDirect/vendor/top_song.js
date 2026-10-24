// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 新歌速递

import createOption from '../options';
export default (query, request) => {
  const data = {
    areaId: query.type || 0, // 全部:0 华语:7 欧美:96 日本:8 韩国:16
    // limit: query.limit || 100,
    // offset: query.offset || 0,
    total: true,
  }
  return request(
    `/api/v1/discovery/new/songs`,
    data,
    createOption(query, 'weapi'),
  )
}
