// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 云盘数据

import createOption from '../options';
export default (query, request) => {
  const data = {
    limit: query.limit || 30,
    offset: query.offset || 0,
  }
  return request(`/api/v1/cloud/get`, data, createOption(query, 'weapi'))
}
