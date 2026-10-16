// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 私人FM - 模式选择

import createOption from '../options';
export default (query, request) => {
  const data = {
    mode: query.mode,
    subMode: query.submode,
    limit: query.limit || 3,
  }
  return request(`/api/v1/radio/get`, data, createOption(query))
}
