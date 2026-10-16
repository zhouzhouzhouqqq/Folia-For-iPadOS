// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 云盘数据详情

import createOption from '../options';
export default (query, request) => {
  const id = query.id.replace(/\s/g, '').split(',')
  const data = {
    songIds: id,
  }
  return request(`/api/v1/cloud/get/byids`, data, createOption(query, 'weapi'))
}
