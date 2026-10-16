// @ts-nocheck
// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.
import createOption from '../options';
export default async (query, request) => {
  const data = {
    type: 3,
  }
  const result = await request(
    `/api/login/qrcode/unikey`,
    data,
    createOption(query),
  )
  return {
    status: 200,
    body: {
      data: result.body,
      code: 200,
    },
    cookie: result.cookie,
  }
}
