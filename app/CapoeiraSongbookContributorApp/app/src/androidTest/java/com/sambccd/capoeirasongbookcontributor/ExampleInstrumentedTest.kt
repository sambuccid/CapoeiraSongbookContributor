package com.sambccd.capoeirasongbookcontributor

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Assert.*

/**
 * Instrumented test, which will execute on an Android device.
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
@RunWith(AndroidJUnit4::class)
class ExampleInstrumentedTest {
    @Test
    fun useAppContext() {
        // Context of the app under test.
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("com.sambccd.capoeirasongbookcontributor", appContext.packageName)
    }

    @Test
    fun updatesBoldValueLine() {
        val a = SongLines()
        a.updateBold(0, true)
        assertEquals(true, a.lines[0].bold)
    }

    @Test
    fun updatesBoldValue() {
        val a = SongLine()
        val b = a.copy(bold = true)
        assertEquals(true, b.bold)
    }

    @Test
    fun decrypt_correctly_from_encrypted_data_in_nodejs() {
        val usablePrivateKey = ""// TODO populate this with private key, all in one line, and without start and end lines(e.g. remove ------Privatekey blablabla----)

        val encrypted = "fEzCMFvGLUdLYIQFUffk4O5vOiQvODk4c2vy/7EzIfpuiVUKxckI4Z8lvi/SVJpMHDrxZjpen2xOvE7my3rhpdwkBKCwjQu70Sg9eAtqRqQSvsVwWetMNrZGm+uQxj6uGOaNjx44UHbo7Dl0uFnaOw4DzWtV6Uj10zXMndQ9B7Cmxj1KhRT7TmLW65CUdHQV55q+AZtxAiMJkFFsPCzQnfihOrEuy2HDtaDhnQSHhOVgyZkRZQqHhEEQwhAKq6HFqjyG9dX+kE3zk8pQPVV6awVSOjewxFz7GGDzX9wDZ5LhJ9I2usEYryhinjANneXqlUGMm09ZUHG6tVLALyk7Xg=="
        val res = Encrypter(BuildConfig.API_PUBLIC_KEY, usablePrivateKey).decrypt(encrypted)
        println(res)
        assertEquals("""{"title":"test","lines":[]}""", res)
    }

    @Test
    fun encrypt_correctly_checking_with_decrypter_tested_above() {
        val usablePrivateKey = ""// TODO populate this with private key, all in one line, and without start and end lines(e.g. remove ------Privatekey blablabla----)
        val song = """{"title":"test","lines":[]}"""

        val encrypter = Encrypter(BuildConfig.API_PUBLIC_KEY, usablePrivateKey)
        val encrypted = encrypter.encrypt(song)

        val decrypted = encrypter.decrypt(encrypted)

        assertEquals(song, decrypted)
    }


}