// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 收藏/取消收藏专辑

import createOption from '../options';
export default (query, request) => {
  query.t = query.t == 1 ? 'sub' : 'unsub'
  const data = {
    id: query.id,
  }
  return request(`/api/album/${query.t}`, data, createOption(query, 'weapi'))
}
