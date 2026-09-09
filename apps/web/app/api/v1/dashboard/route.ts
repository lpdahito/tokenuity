// apps/web/src/app/api/v1/dashboard/route.ts
// import { getDashboard } from '@tokenuity/store'

// export const dynamic = 'force-dynamic'

export async function GET() {
  // return Response.json(await getDashboard())

  return Response.json({success: 200})
}