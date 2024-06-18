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
}