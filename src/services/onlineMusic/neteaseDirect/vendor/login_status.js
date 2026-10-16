// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
import createOption from '../options';
export default async (query, request) => {
  const data = {}
  let result = await request(
    `/api/w/nuser/account/get`,
    data,
    createOption(query, 'weapi'),
  )
  if (result.body.code === 200) {
    result = {
      status: 200,
      body: {
        data: {
          ...result.body,
        },
      },
      cookie: result.cookie,
    }
  }
  return result
}
