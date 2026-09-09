package expo.modules.trailkeys

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Signature
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec

internal class DeviceSigner {
  private val alias = "location-log-signing-v1"
  private val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

  @Synchronized
  fun identity(): Map<String, String> {
    if (!store.containsAlias(alias)) createKey()
    val publicKey = store.getCertificate(alias).publicKey as ECPublicKey
    val publicHex = "04" + publicKey.w.affineX.toString(16).padStart(64, '0') +
      publicKey.w.affineY.toString(16).padStart(64, '0')
    val keyInfo = KeyFactory.getInstance("EC", "AndroidKeyStore")
      .getKeySpec(store.getKey(alias, null), KeyInfo::class.java)
    @Suppress("DEPRECATION")
    val protection = if (keyInfo.isInsideSecureHardware) "android-hardware" else "software"
    return mapOf("publicKeyHex" to publicHex, "protection" to protection)
  }

  @Synchronized
  fun sign(message: String): String {
    require(message.toByteArray(Charsets.UTF_8).size <= 65_536) { "Record too large." }
    val key = store.getKey(alias, null) as? PrivateKey
      ?: error("Signing key is missing. Recording cannot continue.")
    return Signature.getInstance("SHA256withECDSA").run {
      initSign(key)
      update(message.toByteArray(Charsets.UTF_8))
      sign().toHex()
    }
  }

  private fun createKey() {
    val generator = KeyPairGenerator.getInstance("EC", "AndroidKeyStore")
    generator.initialize(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
      .setUserAuthenticationRequired(false)
      .build())
    generator.generateKeyPair()
  }
}
