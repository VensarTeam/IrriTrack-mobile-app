package com.vensar.irritrack

import android.os.Build
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import android.os.Bundle
import android.view.WindowManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  private val playUpdateManager by lazy { AppUpdateManagerFactory.create(this) }
  private var updateCheckRunning = false
  private var updateFlowRunning = false
  private var updatePromptShown = false
  private val playUpdateLauncher = registerForActivityResult(
    ActivityResultContracts.StartIntentSenderForResult()
  ) {
    // Cancellation/failure does not block the app or immediately re-prompt.
    updateFlowRunning = false
  }

  override fun onResume() {
    super.onResume()
    checkPlayUpdate()
  }

  private fun checkPlayUpdate() {
    if (BuildConfig.DEBUG || updateCheckRunning || updateFlowRunning) return
    updateCheckRunning = true
    playUpdateManager.appUpdateInfo.addOnSuccessListener { info ->
      updateCheckRunning = false
      if (isFinishing || isDestroyed || !lifecycle.currentState.isAtLeast(androidx.lifecycle.Lifecycle.State.RESUMED)) return@addOnSuccessListener
      val resumeUpdate = info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
      val newUpdate = !updatePromptShown && info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
        info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
      if (resumeUpdate || newUpdate) {
        updatePromptShown = true
        try {
          updateFlowRunning = playUpdateManager.startUpdateFlowForResult(
            info, playUpdateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
          )
        } catch (_: Exception) {
          updateFlowRunning = false
        }
      }
    }.addOnFailureListener {
      // Offline, sideloaded and Play-ineligible installs continue normally.
      updateCheckRunning = false
    }
  }

  override fun onSaveInstanceState(outState: Bundle) {
    outState.putBoolean("playUpdatePromptShown", updatePromptShown)
    super.onSaveInstanceState(outState)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
    updatePromptShown = savedInstanceState?.getBoolean("playUpdatePromptShown") ?: false
      window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
      )
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
