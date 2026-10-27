/** What a provider's refusal means, keyed by the code S3 and Bun's client answer with. */
export const STORAGE_REFUSALS: Record<string, string> = {
  AccessDenied:
    'The bucket turned these keys away. They need to read, write and delete in this bucket.',
  InvalidAccessKeyId: 'The provider does not know this access key ID.',
  SignatureDoesNotMatch: 'The secret does not belong to this access key ID.',
  NoSuchBucket: 'There is no bucket by that name at this address.',
  AuthorizationHeaderMalformed: 'The bucket lives in another region than the one typed here.',
  PermanentRedirect: 'The bucket lives in another region than the one typed here.',
  ConnectionRefused: 'Nothing answered at this address.',
  DNSResolveFailed: 'This address does not lead anywhere. Check the endpoint.',
}
