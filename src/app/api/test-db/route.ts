import { testDatabaseConnection } from '@/lib/actions/transaction.action';

export async function GET() {
  const result = await testDatabaseConnection();
  return Response.json(result);
}