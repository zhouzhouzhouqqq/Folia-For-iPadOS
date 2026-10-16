// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 专辑动态信息
import createOption from '../options';
export default (query, request) => {
  const data = {
    id: query.id,
  }
  return request(
    `/api/album/detail/dynamic`,
    data,
    createOption(query, 'weapi'),
  )
}
