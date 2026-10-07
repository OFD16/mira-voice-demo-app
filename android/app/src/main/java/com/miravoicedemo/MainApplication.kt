package com.miravoicedemo

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.livekit.reactnative.LiveKitReactNative
import com.livekit.reactnative.audio.AudioType

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    // L2-02: voice-call audio mode, set up BEFORE super.onCreate(). CommunicationAudioType turns on hardware
    // echo cancellation (AEC); MediaAudioType would let the agent hear itself and interrupt itself.
    LiveKitReactNative.setup(this, AudioType.CommunicationAudioType())
    super.onCreate()
    loadReactNative(this)
  }
}
