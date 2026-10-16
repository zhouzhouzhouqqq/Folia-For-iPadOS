// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 副歌时间
import createOption from '../options';
export default (query, request) => {
  return request(
    `/api/song/chorus`,
    {
      ids: JSON.stringify([query.id]),
    },
    createOption(query),
  )
}
