// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
// 首页-发现 block page
// 这个接口为移动端接口，首页-发现页，数据结构可以参考 https://github.com/hcanyz/flutter-netease-music-api/blob/master/lib/src/api/uncategorized/bean.dart#L259 HomeBlockPageWrap
// query.refresh 是否刷新数据
import createOption from '../options';
export default (query, request) => {
  const data = { refresh: query.refresh || false, cursor: query.cursor }
  return request(`/api/homepage/block/page`, data, createOption(query, 'weapi'))
}
