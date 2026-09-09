import ExpoModulesCore
import CommonCrypto
import Foundation

public class TrailKeysModule: Module {
  private let signer = DeviceSigner()

  public func definition() -> ModuleDefinition {
    Name("TrailKeys")
    AsyncFunction("getIdentity") { try self.signer.identity() }
    AsyncFunction("sign") { (message: String) in try self.signer.sign(message) }
    Function("uptimeMilliseconds") { ProcessInfo.processInfo.systemUptime * 1000 }
    AsyncFunction("protectStorage") {
      let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      var directory = documents.appendingPathComponent("SQLite", isDirectory: true)
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try directory.setResourceValues(values)
    }
    AsyncFunction("derivePasscode") { (passcode: String, saltHex: String) in
      guard passcode.range(of: "^[0-9]{6,12}$", options: .regularExpression) != nil,
            saltHex.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil else {
        throw TrailKeyError.invalidInput
      }
      let salt = stride(from: 0, to: saltHex.count, by: 2).map { offset -> UInt8 in
        let start = saltHex.index(saltHex.startIndex, offsetBy: offset)
        return UInt8(saltHex[start..<saltHex.index(start, offsetBy: 2)], radix: 16)!
      }
      var derived = [UInt8](repeating: 0, count: 32)
      let status = passcode.withCString { password in
        salt.withUnsafeBufferPointer { saltBuffer in
          CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2), password,
            passcode.utf8.count, saltBuffer.baseAddress, salt.count,
            CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), 600_000, &derived, 32)
        }
      }
      guard status == kCCSuccess else { throw TrailKeyError.derivationFailed }
      return Data(derived).hex
    }
  }
}

enum TrailKeyError: Error {
  case invalidInput, derivationFailed, missingKey, keyOperationFailed
}

extension Data {
  var hex: String { map { String(format: "%02x", $0) }.joined() }
}
