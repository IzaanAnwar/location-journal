package expo.modules.trailkeys

import android.os.SystemClock
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

class TrailKeysModule : Module() {
  private val signer = DeviceSigner()

  override fun definition() = ModuleDefinition {
    Name("TrailKeys")
    AsyncFunction("getIdentity") { signer.identity() }
    AsyncFunction("sign") { message: String -> signer.sign(message) }
    Function("uptimeMilliseconds") { SystemClock.elapsedRealtime().toDouble() }
    AsyncFunction("protectStorage") { true } // Android backup is disabled in the manifest.
    AsyncFunction("derivePasscode") { passcode: String, saltHex: String ->
      require(passcode.matches(Regex("[0-9]{6,12}"))) { "Use 6 to 12 digits." }
      require(saltHex.matches(Regex("[a-f0-9]{64}"))) { "Invalid salt." }
      val salt = saltHex.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
      val specification = PBEKeySpec(passcode.toCharArray(), salt, 600_000, 256)
      try {
        SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
          .generateSecret(specification).encoded.toHex()
      } finally {
        specification.clearPassword()
      }
    }
  }
}

internal fun ByteArray.toHex(): String = joinToString("") { "%02x".format(it) }
