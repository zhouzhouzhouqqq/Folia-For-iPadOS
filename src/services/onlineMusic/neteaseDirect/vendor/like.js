// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 红心与取消红心歌曲

import createOption from '../options';
export default (query, request) => {
  query.like = query.like == 'false' ? false : true
  const data = {
    alg: 'itembased',
    trackId: query.id,
    like: query.like,
    time: '3',
  }
  return request(`/api/radio/like`, data, createOption(query, 'weapi'))
}
