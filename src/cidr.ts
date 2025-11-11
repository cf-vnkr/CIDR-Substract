/**
 * CIDR utility functions for IPv4 address manipulation and subtraction
 */

export interface CIDRRange {
  ip: string;
  prefix: number;
  startIP: number;
  endIP: number;
}

/**
 * Convert IPv4 address string to 32-bit integer
 */
export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => p < 0 || p > 255 || isNaN(p))) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Convert 32-bit integer to IPv4 address string
 */
export function intToIp(num: number): string {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF
  ].join('.');
}

/**
 * Parse CIDR notation (e.g., "192.168.1.0/24") into structured range
 */
export function parseCIDR(cidr: string): CIDRRange {
  const trimmed = cidr.trim();
  const parts = trimmed.split('/');

  if (parts.length !== 2) {
    throw new Error(`Invalid CIDR notation: ${cidr}. Expected format: xxx.xxx.xxx.xxx/xx`);
  }

  const ip = parts[0];
  const prefix = parseInt(parts[1], 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid prefix length: ${parts[1]}. Must be between 0 and 32`);
  }

  const ipInt = ipToInt(ip);
  const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const startIP = (ipInt & mask) >>> 0;
  const endIP = (startIP | (~mask >>> 0)) >>> 0;

  return {
    ip,
    prefix,
    startIP,
    endIP
  };
}

/**
 * Check if two CIDR ranges overlap
 */
export function rangesOverlap(range1: CIDRRange, range2: CIDRRange): boolean {
  return !(range1.endIP < range2.startIP || range2.endIP < range1.startIP);
}

/**
 * Check if range2 is completely contained within range1
 */
export function rangeContains(range1: CIDRRange, range2: CIDRRange): boolean {
  return range1.startIP <= range2.startIP && range1.endIP >= range2.endIP;
}

/**
 * Count trailing zeros in a 32-bit number
 */
function countTrailingZeros(n: number): number {
  if (n === 0) return 32;
  let count = 0;
  while ((n & 1) === 0) {
    n >>>= 1;
    count++;
  }
  return count;
}

/**
 * Convert an IP range (start and end integers) to CIDR notation
 * Returns an array of CIDR blocks that cover the range
 */
export function rangeToCIDRs(startIP: number, endIP: number): string[] {
  const cidrs: string[] = [];
  let iteration = 0;
  const MAX_ITERATIONS = 1000; // Safety limit

  while (startIP <= endIP) {
    // Safety check to prevent infinite loops
    if (iteration++ > MAX_ITERATIONS) {
      console.error(`rangeToCIDRs exceeded max iterations for range ${intToIp(startIP)} - ${intToIp(endIP)}`);
      break;
    }

    // Find the maximum CIDR block size based on:
    // 1. Alignment of startIP (how many trailing zeros it has)
    // 2. The remaining range size (endIP - startIP + 1)

    const trailingZeros = countTrailingZeros(startIP);
    const maxSizeFromAlignment = trailingZeros;

    // Calculate the maximum size that fits within the remaining range
    const remainingIPs = (endIP - startIP + 1) >>> 0;
    let maxSizeFromRange = 0;

    // Find the largest power of 2 that fits in remainingIPs
    for (let i = 0; i <= 32; i++) {
      if ((1 << i) > remainingIPs) {
        maxSizeFromRange = Math.max(0, i - 1);
        break;
      }
    }

    // Take the minimum of the two constraints
    const blockSize = Math.min(maxSizeFromAlignment, maxSizeFromRange);
    const prefix = 32 - blockSize;

    cidrs.push(`${intToIp(startIP)}/${prefix}`);

    // Check if we've reached the end
    if (startIP === endIP || startIP === 0xFFFFFFFF) break;

    // Move to the next block
    const ipsInBlock = (1 << blockSize) >>> 0;
    const nextIP = (startIP + ipsInBlock) >>> 0;

    // Detect overflow/wrap-around
    if (nextIP <= startIP) break;

    startIP = nextIP;
  }

  return cidrs;
}

/**
 * Aggregate and optimize a list of CIDR ranges
 * Merges adjacent ranges and converts to minimal set of CIDR blocks
 */
export function aggregateCIDRs(cidrs: string[]): string[] {
  if (cidrs.length === 0) return [];
  if (cidrs.length === 1) return cidrs;

  // Parse all CIDRs into ranges
  const ranges = cidrs.map(parseCIDR);

  // Sort by start IP
  ranges.sort((a, b) => a.startIP - b.startIP);

  // Merge overlapping or adjacent ranges
  const merged: Array<{ startIP: number; endIP: number }> = [];
  let current = { startIP: ranges[0].startIP, endIP: ranges[0].endIP };

  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];

    // Check if ranges are adjacent or overlapping
    // Adjacent means endIP + 1 === next.startIP
    if (current.endIP + 1 >= next.startIP) {
      // Merge ranges
      current.endIP = Math.max(current.endIP, next.endIP);
    } else {
      // Ranges are separate, save current and start new
      merged.push({ ...current });
      current = { startIP: next.startIP, endIP: next.endIP };
    }
  }

  // Don't forget the last range
  merged.push(current);

  // Convert merged ranges back to optimal CIDR blocks
  const result: string[] = [];
  for (const range of merged) {
    result.push(...rangeToCIDRs(range.startIP, range.endIP));
  }

  return result;
}

/**
 * Subtract the smaller CIDR range from the larger one
 * Returns an array of aggregated CIDR blocks representing the remaining ranges
 */
export function subtractCIDR(cidr1: string, cidr2: string): string[] {
  const range1 = parseCIDR(cidr1);
  const range2 = parseCIDR(cidr2);

  // Check if ranges overlap
  if (!rangesOverlap(range1, range2)) {
    return [cidr1]; // No overlap, return original range
  }

  // Determine which range is larger
  const largerRange = (range1.endIP - range1.startIP) >= (range2.endIP - range2.startIP) ? range1 : range2;
  const smallerRange = largerRange === range1 ? range2 : range1;

  // If smaller range is not contained in larger range, return error
  if (!rangeContains(largerRange, smallerRange)) {
    throw new Error('Ranges overlap but neither fully contains the other. Subtraction requires one range to be fully contained in the other.');
  }

  const results: string[] = [];

  // Add range before the subtracted range
  if (largerRange.startIP < smallerRange.startIP) {
    const beforeCIDRs = rangeToCIDRs(largerRange.startIP, smallerRange.startIP - 1);
    results.push(...beforeCIDRs);
  }

  // Add range after the subtracted range
  if (smallerRange.endIP < largerRange.endIP) {
    const afterCIDRs = rangeToCIDRs(smallerRange.endIP + 1, largerRange.endIP);
    results.push(...afterCIDRs);
  }

  // Aggregate the results to minimize the number of CIDR blocks
  return aggregateCIDRs(results);
}

/**
 * Validate CIDR notation
 */
export function isValidCIDR(cidr: string): boolean {
  try {
    parseCIDR(cidr);
    return true;
  } catch {
    return false;
  }
}
