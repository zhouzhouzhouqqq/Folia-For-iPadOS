// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 私人FM

import createOption from '../options';
export default (query, request) => {
  return request(`/api/v1/radio/get`, {}, createOption(query, 'weapi'))
}
