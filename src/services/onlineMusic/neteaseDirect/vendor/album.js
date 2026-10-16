// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 专辑内容

import createOption from '../options';
export default (query, request) => {
  return request(`/api/v1/album/${query.id}`, {}, createOption(query, 'weapi'))
}
