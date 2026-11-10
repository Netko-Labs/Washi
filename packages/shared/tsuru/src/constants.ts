/** IPv4 ranges no fetch reaches unless the server lifted the guard (D118): RFC 6890 and friends. */
export const PRIVATE_V4 = [
  { base: '0.0.0.0', bits: 8 }, // this network
  { base: '10.0.0.0', bits: 8 },
  { base: '100.64.0.0', bits: 10 }, // carrier-grade NAT
  { base: '127.0.0.0', bits: 8 },
  { base: '169.254.0.0', bits: 16 }, // link-local, cloud metadata
  { base: '172.16.0.0', bits: 12 },
  { base: '192.0.0.0', bits: 24 }, // IETF protocol assignments
  { base: '192.0.2.0', bits: 24 }, // documentation
  { base: '192.88.99.0', bits: 24 }, // 6to4 relay anycast
  { base: '192.168.0.0', bits: 16 },
  { base: '198.18.0.0', bits: 15 }, // benchmarking
  { base: '198.51.100.0', bits: 24 }, // documentation
  { base: '203.0.113.0', bits: 24 }, // documentation
  { base: '224.0.0.0', bits: 4 }, // multicast
  { base: '240.0.0.0', bits: 4 }, // reserved, broadcast
] as const

/** IPv6 ranges no fetch reaches; addresses carrying an IPv4 one are judged by that one too. */
export const PRIVATE_V6 = [
  { base: '::', bits: 128 }, // unspecified
  { base: '::1', bits: 128 }, // loopback
  { base: '64:ff9b:1::', bits: 48 }, // local-use NAT64
  { base: '100::', bits: 64 }, // discard
  { base: '2001:db8::', bits: 32 }, // documentation
  { base: 'fc00::', bits: 7 }, // unique local
  { base: 'fe80::', bits: 10 }, // link-local
  { base: 'fec0::', bits: 10 }, // site-local (deprecated)
  { base: 'ff00::', bits: 8 }, // multicast
] as const

/** Names only an inside network answers. */
export const PRIVATE_NAMES = new Set(['localhost', 'metadata', 'metadata.google.internal'])
export const PRIVATE_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa', '.lan']
