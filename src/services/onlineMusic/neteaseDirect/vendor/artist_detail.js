// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
import createOption from '../options';
export default (query, request) => {
  return request(
    `/api/artist/head/info/get`,
    {
      id: query.id,
    },
    createOption(query),
  )
}
