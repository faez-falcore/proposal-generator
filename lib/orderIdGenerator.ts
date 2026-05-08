// lib/orderIdGenerator.ts

/**
 * Generates a structured order ID for proposals
 * Format: XMA-YYYY-MM-NNNNN
 * Where:
 * - XMA is the company prefix
 * - YYYY is the current year
 * - MM is the current month
 * - NNNNN is a sequential number (padded with zeros)
 *
 * @param {number} sequentialNumber - A sequential number to ensure uniqueness
 * @returns {string} The formatted order ID
 */
export function generateOrderId(sequentialNumber: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  
  // Ensure sequentialNumber is a valid number
  const validSequence = typeof sequentialNumber === 'number' && !isNaN(sequentialNumber) 
    ? sequentialNumber 
    : 1;
  
  const sequence = String(validSequence).padStart(5, "0");

  return `XMA-${year}-${month}-${sequence}`;
}

/**
 * Gets the next sequential number for order IDs
 * In a production environment, this would typically be handled by a database sequence
 * or transaction to ensure uniqueness
 *
 * @param supabase - The Supabase client
 * @returns {Promise<number>} The next sequential number
 */
export async function getNextSequentialNumber(supabase: any): Promise<number> {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthStr = String(currentMonth).padStart(2, "0");
  const pattern = `XMA-${currentYear}-${monthStr}-%`;

  const [{ data: classicData }, { data: animatedData }] = await Promise.all([
    supabase
      .from("proposals")
      .select("order_id")
      .not("order_id", "is", null)
      .filter("order_id", "like", pattern)
      .order("order_id", { ascending: false })
      .limit(1),
    supabase
      .from("animated_proposals")
      .select("order_id")
      .not("order_id", "is", null)
      .filter("order_id", "like", pattern)
      .order("order_id", { ascending: false })
      .limit(1),
  ]);

  const candidates = [
    ...(classicData ?? []),
    ...(animatedData ?? []),
  ]
    .map((row: { order_id: string }) => {
      const part = row.order_id?.split("-").pop();
      return part && !isNaN(parseInt(part)) ? parseInt(part) : 0;
    })
    .filter((n: number) => n > 0);

  return candidates.length > 0 ? Math.max(...candidates) + 1 : 1;
}
