// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 所有榜单介绍

import createOption from '../options';
export default (query, request) => {
  return request(`/api/toplist`, {}, createOption(query))
}
