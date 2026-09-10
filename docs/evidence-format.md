# Evidence format v1

The export is UTF-8 JSON Lines with a terminating newline. Line 1 is a header. Subsequent lines contain signed record envelopes. This specification is a development format and must be reviewed before making forensic claims.

## Header

Fields: `type: header`, `format: location-log/v1`, `identity`, `exportedAt`, `timeSource`, `independentTimestamp`, `scope`, `head`, and `note`.

`identity.publicKeyHex` is an uncompressed SEC1 P-256 public key: `04 || X || Y`, with X/Y each 32 bytes. `keyId` is SHA-256 of its lowercase hexadecimal string encoded as UTF-8. `protection` describes the native API's reported key storage; it is not remote attestation. The key ID is an installation signing identity, not a verified IMEI, owner identity, or government identifier.

The header is not signed. Its time, scope, protection label, and other claims must not be treated as independently authenticated. Its head is checked against the records, but an attacker can rewrite it when truncating the file. Use a separately preserved checkpoint to detect that case.

## Record envelope

Fields: `type: record`, `body`, `hash`, `signature`.

- `body` is a string. Verify the exact UTF-8 string bytes, not a parsed and reformatted object.
- `hash` is lowercase hex SHA-256 of `body`.
- `signature` is hex DER-encoded ECDSA over SHA-256 of `body`, using P-256. High-S and low-S signatures are both valid. Signature bytes are not used as the chain link.
- `body.previousHash` references the preceding body hash. Genesis references 64 zeroes.
- `body.sequence` starts at 1 and increases without gaps.
- Bodies include format, key ID, receipt wall time in Unix milliseconds, receipt monotonic uptime in milliseconds, runtime ID, event kind, and payload.

The app encodes plain JSON values with lexically sorted object keys. Undefined, non-finite values, and non-plain objects are rejected. This restricted encoding is documented for this format; do not assume it implements every requirement of RFC 8785. The verifier checks signed bytes directly.

## Location observations

Coordinates retain the original numeric values. The display rounds coordinates only for readability. Reported accuracy is a measurement estimate, not a guarantee. `measuredAt` is the OS-provided observation time; `recordedAt` is when the app writes the record. Receipt uptime does not claim to be GNSS fix uptime. `mocked: null` means the wrapper did not expose that information, not that spoofing was ruled out.

The location source is labelled `os-location-service`. There is no claim that all readings are satellite-only or that the app can identify every fused input. Negative unavailable accuracy values are retained and displayed as unavailable.

## Events and gaps

`session-start`, `session-stop`, `location`, `interruption`, `configuration`, and `error` are supported. A `configuration` event records a successfully applied recording-option change, such as an update from a legacy 10-second Android request to the hourly request. It is an app receipt of the native registration call, not proof that the OS delivered readings at that cadence. A gap event describes a separation over 120 seconds between observed measurement times. It does not establish a cause, or count every missing fix. Deliberate stops also create coverage gaps; their session events remain in the history. There is no evidence of a location during an interval with no observation.

## Indian evidence preparation

Preserve the original phone and database, the exact export file and its SHA-256, the software/build version, device particulars, and a documented custody history. The responsible party and an appropriate expert must prepare and sign the applicable certificate. Do not auto-assert regular operation or completeness when failures occurred.

The Bharatiya Sakshya Adhiniyam Sections 61–63 and Schedule are the starting point for electronic outputs. Section 170 affects older proceedings. These requirements are case-dependent; this format is not a legal certification. Source: https://www.indiacode.nic.in/indiacode/bitstream/123456789/20063/1/aa202347.pdf

Independent timestamps remain unimplemented. A future RFC 3161 integration should commit to a nonce-bearing batch root, retain tokens and certificate validation material, and expose checkpoint delay and provider failure. CCA reference: https://www.cca.gov.in/timestamping.html
