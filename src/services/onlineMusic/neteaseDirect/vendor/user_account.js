// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
import createOption from '../options';
export default (query, request) => {
  const data = {}
  return request(`/api/nuser/account/get`, data, createOption(query, 'weapi'))
}
