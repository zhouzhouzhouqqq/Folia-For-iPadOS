// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 垃圾桶

import createOption from '../options';
export default (query, request) => {
  const data = {
    songId: query.id,
    alg: 'RT',
    time: query.time || 25,
  }
  return request(`/api/radio/trash/add`, data, createOption(query, 'weapi'))
}
