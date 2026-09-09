import Foundation
import Security

final class DeviceSigner {
  private let tag = Data("location-log-signing-v1".utf8)
  private let lock = NSLock()

  func identity() throws -> [String: String] {
    lock.lock()
    defer { lock.unlock() }
    let key = try existingKey() ?? createKey()
    guard let publicKey = SecKeyCopyPublicKey(key),
          let representation = SecKeyCopyExternalRepresentation(publicKey, nil) else {
      throw TrailKeyError.keyOperationFailed
    }
    let attributes = SecKeyCopyAttributes(key) as NSDictionary?
    let isHardware = attributes?[kSecAttrTokenID] as? String == kSecAttrTokenIDSecureEnclave as String
    return ["publicKeyHex": (representation as Data).hex,
            "protection": isHardware ? "secure-enclave" : "software"]
  }

  func sign(_ message: String) throws -> String {
    lock.lock()
    defer { lock.unlock() }
    guard message.utf8.count <= 65_536 else { throw TrailKeyError.invalidInput }
    guard let key = try existingKey() else { throw TrailKeyError.missingKey }
    var error: Unmanaged<CFError>?
    guard let signature = SecKeyCreateSignature(key, .ecdsaSignatureMessageX962SHA256,
      Data(message.utf8) as CFData, &error) else {
      if let error { throw error.takeRetainedValue() }
      throw TrailKeyError.keyOperationFailed
    }
    return (signature as Data).hex
  }

  private func existingKey() throws -> SecKey? {
    let query: [String: Any] = [kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: tag, kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecReturnRef as String: true]
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    if status == errSecItemNotFound { return nil }
    guard status == errSecSuccess else { throw TrailKeyError.keyOperationFailed }
    return (result as! SecKey)
  }

  private func createKey() throws -> SecKey {
    var error: Unmanaged<CFError>?
    guard let access = SecAccessControlCreateWithFlags(nil,
      kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly, .privateKeyUsage, &error) else {
      throw TrailKeyError.keyOperationFailed
    }
    var attributes: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecAttrKeySizeInBits as String: 256,
      kSecPrivateKeyAttrs as String: [kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: tag, kSecAttrAccessControl as String: access]]
    #if !targetEnvironment(simulator)
    attributes[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
    #endif
    guard let key = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
      if let error { throw error.takeRetainedValue() }
      throw TrailKeyError.keyOperationFailed
    }
    return key
  }
}
